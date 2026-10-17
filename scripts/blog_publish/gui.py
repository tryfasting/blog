"""The publish tool's window: pick a manuscript from desk/, preview it, register it, and watch each step."""

from __future__ import annotations

import os
import queue
import threading
import tkinter as tk
from pathlib import Path
from tkinter import messagebox, ttk

from .pipeline import STEPS, Event, Outcome, StepError, list_manuscripts, preview, publish

STATE_MARK = {"": "·", "running": "…", "ok": "✓", "failed": "✗", "skipped": "–"}
STEP_LABEL = {
    "preflight": "사전 점검",
    "validate": "원고 검사",
    "place": "배치",
    "build": "빌드",
    "commit": "커밋",
    "push": "push",
    "actions": "Actions",
    "live": "운영 확인",
}


class PublishWindow:
    def __init__(self, root_dir: Path) -> None:
        self.root_dir = root_dir
        self.events: queue.Queue[Event | Outcome | Exception] = queue.Queue()
        self.busy = False
        self.last_log: Path | None = None

        self.window = tk.Tk()
        self.window.title("desk 원고 등록")
        self.window.geometry("920x640")
        self.window.minsize(720, 480)

        top = ttk.Frame(self.window, padding=12)
        top.pack(fill="both", expand=True)

        header = ttk.Frame(top)
        header.pack(fill="x")
        ttk.Label(header, text="desk/ 원고", font=("", 12, "bold")).pack(side="left")
        ttk.Button(header, text="새로고침", command=self.refresh).pack(side="right")

        columns = ("status", "note")
        self.tree = ttk.Treeview(top, columns=columns, height=9)
        self.tree.heading("#0", text="원고")
        self.tree.heading("status", text="상태")
        self.tree.heading("note", text="비고")
        self.tree.column("#0", width=360)
        self.tree.column("status", width=90, anchor="center")
        self.tree.column("note", width=420)
        self.tree.pack(fill="x", pady=(8, 8))

        buttons = ttk.Frame(top)
        buttons.pack(fill="x")
        self.preview_button = ttk.Button(buttons, text="미리보기", command=self.on_preview)
        self.preview_button.pack(side="left")
        self.publish_button = ttk.Button(buttons, text="등록", command=self.on_publish)
        self.publish_button.pack(side="left", padx=8)
        ttk.Button(buttons, text="로그 열기", command=self.open_log).pack(side="right")

        steps = ttk.Frame(top)
        steps.pack(fill="x", pady=(12, 4))
        self.step_labels: dict[str, ttk.Label] = {}
        for name in STEPS:
            label = ttk.Label(steps, text=f"{STATE_MARK['']} {STEP_LABEL[name]}", width=12)
            label.pack(side="left")
            self.step_labels[name] = label

        # Tk's default fixed font has no Hangul and falls back to a rough bitmap font on Windows.
        log_font = ("Malgun Gothic", 10) if os.name == "nt" else None
        self.log = tk.Text(top, height=14, wrap="word", state="disabled", font=log_font)
        self.log.pack(fill="both", expand=True)

        self.refresh()
        self.window.after(100, self.drain)

    def refresh(self) -> None:
        for item in self.tree.get_children():
            self.tree.delete(item)
        try:
            scan = list_manuscripts(self.root_dir)
        except Exception as error:  # The check script itself failed; show it instead of crashing.
            self.write(f"원고 목록을 읽지 못함: {error}")
            return
        for path in scan["included"]:
            self.tree.insert("", "end", iid=path, text=path, values=("등록 가능", ""))
        for entry in scan["registered"]:
            self.tree.insert(
                "",
                "end",
                iid=entry["path"],
                text=entry["path"],
                values=("등록됨", f"갱신 가능 → {entry['post']}"),
            )
        for entry in scan["excluded"]:
            self.tree.insert(
                "",
                "end",
                iid=entry["path"],
                text=entry["path"],
                values=("제외", "; ".join(entry["problems"])),
            )
        self.write(f"원고 {len(self.tree.get_children())}개를 읽음 ({scan['checkedAt']})")

    def selected(self) -> str | None:
        selection = self.tree.selection()
        if not selection:
            messagebox.showinfo("원고 선택", "목록에서 원고를 먼저 고르세요.")
            return None
        return selection[0]

    def on_preview(self) -> None:
        manuscript = self.selected()
        if manuscript and not self.busy:
            self.start(lambda: preview(self.root_dir, manuscript, self.events.put))

    def on_publish(self) -> None:
        manuscript = self.selected()
        if not manuscript or self.busy:
            return
        status = self.tree.set(manuscript, "status")
        if status == "제외":
            messagebox.showwarning("등록할 수 없음", self.tree.set(manuscript, "note"))
            return
        if not messagebox.askyesno("등록", f"{manuscript}\n\n블로그에 공개합니다. 진행할까요?"):
            return
        if status == "등록됨" and not messagebox.askyesno(
            "갱신", "이미 등록된 글을 이 원고 내용으로 덮어씁니다. 계속할까요?"
        ):
            return
        for name in STEPS:
            self.mark(name, "")
        # Already confirmed above, so the pipeline's own update question is answered yes.
        self.start(
            lambda: publish(self.root_dir, manuscript, self.events.put, confirm_update=lambda _post: True)
        )

    def start(self, job) -> None:
        self.busy = True
        self.preview_button.state(["disabled"])
        self.publish_button.state(["disabled"])

        def work() -> None:
            try:
                self.events.put(job())
            except Exception as error:  # Shown in the window and the log; the pipeline logs its own steps.
                self.events.put(error)

        threading.Thread(target=work, daemon=True).start()

    def drain(self) -> None:
        while not self.events.empty():
            item = self.events.get()
            if isinstance(item, Event):
                if item.kind == "step":
                    self.mark(item.step, item.state)
                else:
                    self.write(item.text)
            else:
                self.finish(item)
        self.window.after(100, self.drain)

    def finish(self, result: Outcome | Exception | str) -> None:
        self.busy = False
        self.preview_button.state(["!disabled"])
        self.publish_button.state(["!disabled"])
        if isinstance(result, Outcome):
            self.last_log = result.log
            if result.ok:
                messagebox.showinfo("완료", f"공개됨: {result.url}")
            else:
                step = STEP_LABEL.get(result.failed_step, result.failed_step)
                messagebox.showerror("실패", f"실패 단계: {step}\n{result.message}\n\n로그: {result.log}")
            self.refresh()
        elif isinstance(result, str):
            self.write(f"미리보기를 브라우저로 열었습니다: {result}")
        elif isinstance(result, Exception):
            message = result.message if isinstance(result, StepError) else str(result)
            self.write(f"오류: {message}")
            messagebox.showerror("오류", message)

    def mark(self, step: str, state: str) -> None:
        if step in self.step_labels:
            self.step_labels[step].configure(text=f"{STATE_MARK.get(state, '·')} {STEP_LABEL[step]}")

    def write(self, text: str) -> None:
        self.log.configure(state="normal")
        self.log.insert("end", text + "\n")
        self.log.see("end")
        self.log.configure(state="disabled")

    def open_log(self) -> None:
        """Opens the last run's log, or the log folder when nothing has run yet in this window."""
        target = self.last_log or self.root_dir / "logs" / "publish"
        if not target.exists():
            messagebox.showinfo("로그", "아직 로그가 없습니다.")
        elif os.name == "nt":
            os.startfile(target)
        else:
            messagebox.showinfo("로그", str(target))


def run_window(root_dir: Path) -> None:
    PublishWindow(root_dir).window.mainloop()
