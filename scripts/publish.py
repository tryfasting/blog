# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Publish tool for the blog: register a manuscript from desk/ and follow it to the live site.

    uv run scripts/publish.py                         window (same as double-clicking publish.cmd)
    uv run scripts/publish.py list                    manuscripts and their status
    uv run scripts/publish.py preview <manuscript>    open it in `npm run dev`
    uv run scripts/publish.py publish <manuscript>    register (or update) it
    uv run scripts/publish.py remove <slug>           take a registered post off the site

Runs only code: the manuscript check, npm, git and the GitHub API. Logs go to logs/publish/.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from blog_publish.pipeline import Event, StepError, list_manuscripts, preview, publish, remove

ROOT = Path(__file__).resolve().parents[1]


def print_event(event: Event) -> None:
    if event.kind == "step":
        print(f"[{event.step}] {event.state}", flush=True)
    else:
        print(f"    {event.text}", flush=True)


def ask(question: str, assume_yes: bool) -> bool:
    if assume_yes:
        return True
    return input(f"{question} [y/N] ").strip().lower() in {"y", "yes"}


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="desk/ 원고 등록 도구")
    commands = parser.add_subparsers(dest="command")
    commands.add_parser("list", help="원고 목록과 상태")
    preview_args = commands.add_parser("preview", help="npm run dev에서 원고 보기")
    preview_args.add_argument("manuscript")
    publish_args = commands.add_parser("publish", help="원고 등록(이미 등록된 글이면 갱신)")
    publish_args.add_argument("manuscript")
    remove_args = commands.add_parser("remove", help="등록된 글 내리기")
    remove_args.add_argument("slug")
    for sub in (publish_args, remove_args):
        sub.add_argument("--yes", action="store_true", help="확인 질문에 모두 예")
    for sub in (preview_args, publish_args, remove_args):
        sub.add_argument("--no-browser", action="store_true", help="끝나도 브라우저를 열지 않음")
    args = parser.parse_args(argv)

    if args.command is None:
        from blog_publish.gui import run_window

        run_window(ROOT)
        return 0
    if args.command == "list":
        scan = list_manuscripts(ROOT)
        for path in scan["included"]:
            print(f"등록 가능  {path}")
        for entry in scan["registered"]:
            print(f"등록됨     {entry['path']} → {entry['post']}")
        for entry in scan["excluded"]:
            print(f"제외       {entry['path']}: {'; '.join(entry['problems'])}")
        return 0
    if args.command == "preview":
        try:
            preview(ROOT, args.manuscript, print_event, open_browser=not args.no_browser)
        except StepError as error:
            print(error.message)
            return 1
        return 0
    if args.command == "publish":
        if not ask(f"{args.manuscript}을(를) 블로그에 공개합니다. 진행할까요?", args.yes):
            return 1
        outcome = publish(
            ROOT,
            args.manuscript,
            print_event,
            confirm_update=lambda post: ask(f"이미 등록된 글({post})을 이 원고로 갱신할까요?", args.yes),
            open_browser=not args.no_browser,
        )
    else:
        if not ask(f"등록된 글 {args.slug}을(를) 블로그에서 내립니다. 진행할까요?", args.yes):
            return 1
        outcome = remove(ROOT, args.slug, print_event, open_browser=not args.no_browser)
    if outcome.ok:
        print(f"완료: {outcome.url}\n로그: {outcome.log}")
        return 0
    print(f"실패 단계: {outcome.failed_step}\n{outcome.message}\n로그: {outcome.log}")
    return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
