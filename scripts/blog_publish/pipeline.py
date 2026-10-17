"""The registration stretch of the pipeline: desk/ -> posts/ -> push -> GitHub Actions -> live site.

Every run writes logs/publish/<time>_<slug>.log (each step's start, end, duration, command, exit code
and output) and appends one line to logs/publish/summary.jsonl. A failure before the push undoes
everything the run changed, so the repository is left as it was.
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import time
import urllib.error
import urllib.request
import webbrowser
from collections.abc import Callable, Iterator
from contextlib import contextmanager
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path

from .rules import (
    Action,
    commit_message,
    github_repo,
    log_file_name,
    logs_to_prune,
    plan_placement,
    post_url,
    slug_from_filename,
)

SITE = "https://tryfasting.github.io/blog/"
DEV_URL = "http://127.0.0.1:4321/blog/"
STEPS = ("preflight", "validate", "place", "build", "commit", "push", "actions", "live")
KST = timezone(timedelta(hours=9))
NPM = "npm.cmd" if os.name == "nt" else "npm"
NPX = "npx.cmd" if os.name == "nt" else "npx"


@dataclass
class Event:
    """Progress for the window or the terminal: a step starting or ending, or a log line."""

    kind: str  # "step", "log"
    step: str = ""
    state: str = ""  # "running", "ok", "failed", "skipped"
    text: str = ""


class StepError(Exception):
    def __init__(self, step: str, message: str) -> None:
        super().__init__(f"[{step}] {message}")
        self.step = step
        self.message = message


class UpdateDeclinedError(Exception):
    """The owner said no to a confirmation; nothing was changed."""


@dataclass
class Outcome:
    ok: bool
    slug: str
    log: Path
    url: str = ""
    failed_step: str = ""
    message: str = ""
    commit: str = ""
    actions_run: str = ""


@dataclass
class Undo:
    """What to restore if the run fails before the push: files it wrote and their previous contents."""

    written: list[Path] = field(default_factory=list)
    previous: dict[Path, bytes | None] = field(default_factory=dict)

    def remember(self, path: Path) -> None:
        if path not in self.previous:
            self.previous[path] = path.read_bytes() if path.exists() else None

    def restore(self) -> None:
        for path, content in self.previous.items():
            if content is None:
                path.unlink(missing_ok=True)
            else:
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(content)
        # Folders this run created for images (posts/images/<slug>/, maybe posts/images/) go too once empty.
        for folder in {p.parent for p in self.previous}:
            while "images" in folder.parts and folder.is_dir() and not any(folder.iterdir()):
                folder.rmdir()
                folder = folder.parent


class Run:
    """One run of the tool: its log file, its steps and the commands it executes."""

    def __init__(self, root: Path, slug: str, on_event: Callable[[Event], None]) -> None:
        self.root = root
        self.slug = slug
        self.on_event = on_event
        self.started = datetime.now(KST)
        self.log_dir = root / "logs" / "publish"
        self.log_dir.mkdir(parents=True, exist_ok=True)
        for old in logs_to_prune(os.listdir(self.log_dir)):
            (self.log_dir / old).unlink(missing_ok=True)
        self.log_path = self.log_dir / log_file_name(self.started.replace(tzinfo=None), slug)
        self.log(f"시작 {self.started:%Y-%m-%d %H:%M:%S} KST, 저장소 {root}")

    def log(self, text: str) -> None:
        stamp = datetime.now(KST).strftime("%H:%M:%S")
        with self.log_path.open("a", encoding="utf-8") as file:
            for line in text.splitlines() or [""]:
                file.write(f"{stamp} {line}\n")
        self.on_event(Event("log", text=text))

    @contextmanager
    def step(self, name: str) -> Iterator[None]:
        self.on_event(Event("step", step=name, state="running"))
        self.log(f"== {name} 시작")
        begin = time.monotonic()
        try:
            yield
        except BaseException as error:
            self.log(f"== {name} 실패 ({time.monotonic() - begin:.1f}초): {error}")
            self.on_event(Event("step", step=name, state="failed"))
            raise
        self.log(f"== {name} 끝 ({time.monotonic() - begin:.1f}초)")
        self.on_event(Event("step", step=name, state="ok"))

    def skip(self, name: str, reason: str) -> None:
        self.log(f"== {name} 건너뜀: {reason}")
        self.on_event(Event("step", step=name, state="skipped"))

    def cmd(self, step: str, *args: str, check: bool = True) -> subprocess.CompletedProcess[str]:
        self.log(f"$ {' '.join(args)}")
        result = subprocess.run(
            args, cwd=self.root, capture_output=True, text=True, encoding="utf-8", errors="replace"
        )
        output = (result.stdout + result.stderr).strip()
        if output:
            self.log(output)
        self.log(f"(종료 코드 {result.returncode})")
        if check and result.returncode != 0:
            raise StepError(step, f"명령 실패: {' '.join(args)} (종료 코드 {result.returncode})")
        return result

    def summary(self, outcome: Outcome, action: str) -> None:
        record = {
            "startedAt": self.started.isoformat(timespec="seconds"),
            "slug": outcome.slug,
            "action": action,
            "ok": outcome.ok,
            "failedStep": outcome.failed_step,
            "message": outcome.message,
            "commit": outcome.commit,
            "actionsRun": outcome.actions_run,
            "url": outcome.url,
            "seconds": round((datetime.now(KST) - self.started).total_seconds(), 1),
            "log": self.log_path.name,
        }
        with (self.log_dir / "summary.jsonl").open("a", encoding="utf-8") as file:
            file.write(json.dumps(record, ensure_ascii=False) + "\n")


def check_manuscript(root: Path, manuscript: str) -> dict:
    """The manuscript check from `npm run desk:check` (TypeScript), so the rules exist in one place only."""
    result = subprocess.run(
        ["node", "scripts/desk-check.ts", "--file", manuscript, "--json"],
        cwd=root,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if result.returncode != 0:
        raise StepError("validate", f"원고 검사를 실행하지 못함: {result.stderr.strip()}")
    return json.loads(result.stdout)


def list_manuscripts(root: Path) -> dict:
    result = subprocess.run(
        ["node", "scripts/desk-check.ts", "--json"],
        cwd=root,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip())
    return json.loads(result.stdout)


def preflight(run: Run) -> None:
    """Refuse to start where a commit or push could carry something other than this post."""
    branch = run.cmd("preflight", "git", "rev-parse", "--abbrev-ref", "HEAD").stdout.strip()
    if branch != "main":
        raise StepError("preflight", f"main 브랜치가 아님: {branch}")
    changed = run.cmd("preflight", "git", "status", "--porcelain", "--untracked-files=no").stdout.strip()
    stray = run.cmd("preflight", "git", "status", "--porcelain", "--", "posts").stdout.strip()
    if changed or stray:
        raise StepError("preflight", f"커밋하지 않은 변경이 있음. 먼저 정리할 것:\n{changed or stray}")
    if not (run.root / "node_modules").is_dir():
        raise StepError("preflight", "node_modules가 없음. `npm ci`를 먼저 실행할 것")
    run.cmd("preflight", "git", "fetch", "--quiet", "origin", "main")
    counts = run.cmd(
        "preflight", "git", "rev-list", "--left-right", "--count", "HEAD...origin/main"
    ).stdout.split()
    ahead, behind = (int(value) for value in counts)
    if ahead or behind:
        raise StepError("preflight", f"원격과 어긋남: push 안 한 커밋 {ahead}개, 받지 않은 커밋 {behind}개")


def wait_for_actions(run: Run, sha: str, timeout: float = 900) -> str:
    repo = github_repo(run.cmd("actions", "git", "remote", "get-url", "origin").stdout.strip())
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        runs = fetch_json(f"https://api.github.com/repos/{repo}/actions/runs?head_sha={sha}").get(
            "workflow_runs", []
        )
        if runs and runs[0]["status"] == "completed":
            current = runs[0]
            run.log(f"Actions {current['html_url']}: {current['conclusion']}")
            if current["conclusion"] != "success":
                jobs = fetch_json(
                    f"https://api.github.com/repos/{repo}/actions/runs/{current['id']}/jobs"
                ).get("jobs", [])
                failed = [
                    f"{job['name']} > {step['name']}"
                    for job in jobs
                    for step in job["steps"]
                    if step["conclusion"] == "failure"
                ]
                raise StepError(
                    "actions",
                    f"Actions 실패: {', '.join(failed) or current['conclusion']} ({current['html_url']})",
                )
            return current["html_url"]
        run.log("Actions 진행 중…" if runs else "Actions 실행을 기다리는 중…")
        time.sleep(10)
    raise StepError("actions", f"{timeout // 60:.0f}분 안에 Actions가 끝나지 않음")


def wait_for_url(run: Run, step: str, url: str, expect: int, timeout: float = 300) -> None:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        status = http_status(f"{url}?check={int(time.time())}")
        run.log(f"{url} → {status}")
        if status == expect:
            return
        time.sleep(10)
    raise StepError(step, f"{url}가 {timeout // 60:.0f}분 안에 {expect}가 되지 않음")


def fetch_json(url: str) -> dict:
    request = urllib.request.Request(
        url, headers={"Accept": "application/vnd.github+json", "User-Agent": "tryfasting-blog-publish"}
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def http_status(url: str) -> int:
    try:
        with urllib.request.urlopen(urllib.request.Request(url, method="GET"), timeout=30) as response:
            return response.status
    except urllib.error.HTTPError as error:
        return error.code
    except urllib.error.URLError:
        return 0


def publish(
    root: Path,
    manuscript: str,
    on_event: Callable[[Event], None],
    confirm_update: Callable[[str], bool],
    open_browser: bool = True,
) -> Outcome:
    """Registers one manuscript (or updates its post) and follows it to the live site."""
    slug = slug_from_filename(Path(manuscript).name)
    run = Run(root, slug, on_event)
    outcome = Outcome(ok=False, slug=slug, log=run.log_path)
    action: Action = "add"
    undo = Undo()
    # Rollback only touches posts/ once this run has started changing it, never the owner's own edits.
    changed_posts = False
    pushed = False
    try:
        with run.step("preflight"):
            preflight(run)
        with run.step("validate"):
            check = check_manuscript(root, manuscript)
            run.log(json.dumps(check, ensure_ascii=False))
            if check["status"] == "excluded":
                raise StepError("validate", "원고 검사 실패:\n" + "\n".join(check["problems"]))
            if check["status"] == "registered":
                if not confirm_update(check["post"]):
                    raise UpdateDeclinedError()
                action = "update"
            manuscript = check["path"]
        with run.step("place"):
            changed_posts = True
            text = (root / manuscript).read_text(encoding="utf-8")
            plan = plan_placement(manuscript, text)
            images_dir = root / "posts" / "images" / slug
            if action == "update" and images_dir.exists():
                for old in images_dir.iterdir():
                    undo.remember(old)
                    old.unlink()
            post_path = root / plan.post_path
            undo.remember(post_path)
            post_path.write_text(plan.text, encoding="utf-8", newline="")
            for image in plan.images:
                target = root / image.target
                undo.remember(target)
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(root / image.source, target)
            run.log(f"{plan.post_path}, 이미지 {len(plan.images)}개")
        with run.step("build"):
            run.cmd("build", NPM, "run", "build")
        with run.step("commit"):
            # preflight made sure posts/ had no other changes, so this stages only this post and its images.
            run.cmd("commit", "git", "add", "-A", "--", "posts")
            if run.cmd("commit", "git", "diff", "--cached", "--quiet", check=False).returncode == 0:
                raise StepError("commit", "이미 등록된 글과 내용이 같아 바꿀 것이 없음")
            run.cmd("commit", "git", "commit", "-q", "-m", commit_message(slug, action))
            outcome.commit = run.cmd("commit", "git", "rev-parse", "HEAD").stdout.strip()
        with run.step("push"):
            try:
                run.cmd("push", "git", "push", "origin", "main")
            except StepError:
                run.cmd("push", "git", "reset", "--mixed", "-q", "HEAD~1", check=False)
                outcome.commit = ""
                raise
            pushed = True
        with run.step("actions"):
            outcome.actions_run = wait_for_actions(run, outcome.commit)
        with run.step("live"):
            outcome.url = post_url(SITE, slug)
            wait_for_url(run, "live", outcome.url, 200)
            run.log(f"RSS에 새 글 있음: {f'/blog/{slug}/' in fetch_text(SITE + 'rss.xml')}")
            if open_browser:
                webbrowser.open(outcome.url)
        outcome.ok = True
        run.log(f"완료: {outcome.url}")
    except UpdateDeclinedError:
        outcome.failed_step, outcome.message = "validate", "사용자가 갱신을 취소함"
        run.log(outcome.message)
    except (StepError, OSError, ValueError) as error:
        outcome.failed_step = getattr(error, "step", "") or current_step(run)
        outcome.message = getattr(error, "message", str(error))
        if changed_posts and not pushed:
            run.cmd("rollback", "git", "reset", "-q", "--", "posts", check=False)
            undo.restore()
            run.log("push 전에 실패해 이번 실행이 바꾼 파일을 모두 되돌림")
        else:
            run.log("push 뒤에 실패함. 사이트는 마지막 성공 배포 상태로 남아 있음")
    run.summary(outcome, action)
    return outcome


def remove(root: Path, slug: str, on_event: Callable[[Event], None], open_browser: bool = True) -> Outcome:
    """Takes a registered post off the site: deletes it and its images from posts/, then deploys."""
    run = Run(root, slug, on_event)
    outcome = Outcome(ok=False, slug=slug, log=run.log_path)
    # Rollback only touches posts/ once this run has started changing it, never the owner's own edits.
    changed_posts = False
    pushed = False
    try:
        with run.step("preflight"):
            preflight(run)
            matches = sorted((root / "posts").glob(f"*-{slug}.md"))
            matches = [path for path in matches if slug_from_filename(path.name) == slug]
            if not matches:
                raise StepError("preflight", f"등록된 글이 없음: {slug}")
        run.skip("validate", "내리기에는 원고 검사가 필요 없음")
        with run.step("place"):
            changed_posts = True
            run.cmd(
                "place",
                "git",
                "rm",
                "-q",
                "-r",
                "--ignore-unmatch",
                "--",
                str(matches[0].relative_to(root)),
                f"posts/images/{slug}",
            )
        with run.step("build"):
            run.cmd("build", NPM, "run", "build")
        with run.step("commit"):
            run.cmd("commit", "git", "commit", "-q", "-m", commit_message(slug, "remove"))
            outcome.commit = run.cmd("commit", "git", "rev-parse", "HEAD").stdout.strip()
        with run.step("push"):
            try:
                run.cmd("push", "git", "push", "origin", "main")
            except StepError:
                run.cmd("push", "git", "reset", "--mixed", "-q", "HEAD~1", check=False)
                raise
            pushed = True
        with run.step("actions"):
            outcome.actions_run = wait_for_actions(run, outcome.commit)
        with run.step("live"):
            wait_for_url(run, "live", post_url(SITE, slug), 404)
            if open_browser:
                webbrowser.open(SITE)
        outcome.ok = True
        outcome.url = SITE
    except (StepError, OSError, ValueError) as error:
        outcome.failed_step = getattr(error, "step", "") or current_step(run)
        outcome.message = getattr(error, "message", str(error))
        if changed_posts and not pushed:
            run.cmd("rollback", "git", "reset", "-q", "--", "posts", check=False)
            run.cmd("rollback", "git", "checkout", "--", "posts", check=False)
            run.log("push 전에 실패해 posts/를 되돌림")
    run.summary(outcome, "remove")
    return outcome


def preview(root: Path, manuscript: str, on_event: Callable[[Event], None], open_browser: bool = True) -> str:
    """Restarts `npm run dev` (it scans desk/ only when it starts) and opens the manuscript's page."""
    check = check_manuscript(root, manuscript)
    if check["status"] == "excluded":
        raise StepError("validate", "원고 검사 실패:\n" + "\n".join(check["problems"]))
    slug = slug_from_filename(Path(check["path"]).name)
    subprocess.run([NPX, "astro", "dev", "stop"], cwd=root, capture_output=True)
    subprocess.run([NPM, "run", "dev"], cwd=root, capture_output=True)
    url = f"{DEV_URL}{slug}/"
    deadline = time.monotonic() + 90
    while time.monotonic() < deadline and http_status(url) != 200:
        time.sleep(2)
    on_event(
        Event(
            "log",
            text=f"미리보기: {url}" + (" (등록된 글이 보임)" if check["status"] == "registered" else ""),
        )
    )
    if open_browser:
        webbrowser.open(url)
    return url


def fetch_text(url: str) -> str:
    with urllib.request.urlopen(f"{url}?check={int(time.time())}", timeout=30) as response:
        return response.read().decode("utf-8", errors="replace")


def current_step(run: Run) -> str:
    """The step whose failure line is the last one in the log (used when an error has no step attached)."""
    for line in reversed(run.log_path.read_text(encoding="utf-8").splitlines()):
        for name in STEPS:
            if f"== {name} 실패" in line:
                return name
    return ""
