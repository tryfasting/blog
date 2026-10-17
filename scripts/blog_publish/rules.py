"""Pure rules of the publish tool. No file system, git or network access, so they are unit-tested."""

from __future__ import annotations

import posixpath
import re
from dataclasses import dataclass
from datetime import datetime
from pathlib import PurePosixPath
from typing import Literal
from urllib.parse import unquote

Action = Literal["add", "update", "remove"]

DATE_PREFIX = re.compile(r"^\d{4}-\d{2}-\d{2}-")
# Same image syntax the manuscript check reads (src/blog/lib/manuscript.ts): ![alt](src "title").
IMAGE_LINK = re.compile(r'!\[([^\]]*)\]\(\s*<?([^)\s>]+)>?((?:\s+"[^"]*")?)\s*\)')
NOT_LOCAL = re.compile(r"^(?:[a-z]+:|/|#)", re.IGNORECASE)
LOG_NAME = re.compile(r"^\d{8}-\d{6}_.+\.log$")


class PlacementError(ValueError):
    """The manuscript cannot be placed as it is; the message says why, in Korean."""


@dataclass(frozen=True)
class ImageCopy:
    """Copy `source` to `target`; both are repo-relative POSIX paths."""

    source: str
    target: str


@dataclass(frozen=True)
class Placement:
    """Where a manuscript goes in posts/, its text with image links pointing there, and the images to copy."""

    post_path: str
    text: str
    images: tuple[ImageCopy, ...]


def slug_from_filename(name: str) -> str:
    return DATE_PREFIX.sub("", PurePosixPath(name).stem)


def plan_placement(manuscript_path: str, text: str) -> Placement:
    """Posts all live in posts/, so each post's images go to posts/images/<slug>/ to avoid name clashes.

    Only the image link targets change; the rest of the text is copied as it is.
    """
    name = PurePosixPath(manuscript_path).name
    slug = slug_from_filename(name)
    folder = posixpath.dirname(manuscript_path)
    sources: dict[str, str] = {}

    def relink(match: re.Match[str]) -> str:
        alt, src, title = match.groups()
        if NOT_LOCAL.match(src):
            return match.group(0)
        source = posixpath.normpath(posixpath.join(folder, unquote(src)))
        file_name = posixpath.basename(source)
        if sources.setdefault(file_name, source) != source:
            raise PlacementError(f"이미지 파일 이름이 겹침: {file_name} ({sources[file_name]}, {source})")
        return f"![{alt}](./images/{slug}/{posixpath.basename(src)}{title})"

    new_text = IMAGE_LINK.sub(relink, text)
    images = tuple(
        ImageCopy(source, f"posts/images/{slug}/{file_name}") for file_name, source in sources.items()
    )
    return Placement(f"posts/{name}", new_text, images)


def commit_message(slug: str, action: Action) -> str:
    return f"post: {slug}" if action == "add" else f"post: {action} {slug}"


def log_file_name(started: datetime, slug: str) -> str:
    return f"{started:%Y%m%d-%H%M%S}_{slug}.log"


def logs_to_prune(names: list[str], keep: int = 50) -> list[str]:
    """Run logs beyond the newest `keep`, oldest first. Names start with the run time, so they sort by age."""
    logs = sorted(name for name in names if LOG_NAME.match(name))
    return logs[: max(0, len(logs) - keep)]


def post_url(site: str, slug: str) -> str:
    return f"{site.rstrip('/')}/{slug}/"


def github_repo(remote_url: str) -> str:
    """'owner/name' from an https or ssh GitHub remote URL."""
    match = re.search(r"github\.com[:/]([^/]+)/([^/]+?)(?:\.git)?/?$", remote_url)
    if not match:
        raise ValueError(f"GitHub 원격 주소가 아님: {remote_url}")
    return f"{match.group(1)}/{match.group(2)}"
