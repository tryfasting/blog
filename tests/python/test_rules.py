"""Pure rules of the publish tool: where a manuscript and its images go, names and messages."""

from datetime import datetime

import pytest

from blog_publish.rules import (
    ImageCopy,
    PlacementError,
    commit_message,
    github_repo,
    log_file_name,
    logs_to_prune,
    plan_placement,
    post_url,
    slug_from_filename,
)


def test_slug_is_the_file_name_without_the_date_prefix() -> None:
    assert slug_from_filename("2026-10-20-uv-basics.md") == "uv-basics"


def test_a_manuscript_goes_straight_under_posts() -> None:
    placement = plan_placement("desk/python/2026-10-20-uv-basics.md", "본문만\n")
    assert placement.post_path == "posts/2026-10-20-uv-basics.md"
    assert placement.text == "본문만\n"
    assert placement.images == ()


def test_images_move_to_a_folder_named_after_the_slug_and_links_follow() -> None:
    text = "앞 ![흐름](./images/flow.png) 뒤\n![b](images/my%20shot.png \"제목\")\n"
    placement = plan_placement("desk/python/2026-10-20-uv-basics.md", text)
    assert placement.text == (
        "앞 ![흐름](./images/uv-basics/flow.png) 뒤\n![b](./images/uv-basics/my%20shot.png \"제목\")\n"
    )
    assert placement.images == (
        ImageCopy("desk/python/images/flow.png", "posts/images/uv-basics/flow.png"),
        ImageCopy("desk/python/images/my shot.png", "posts/images/uv-basics/my shot.png"),
    )


def test_images_outside_the_manuscript_folder_are_copied_too() -> None:
    placement = plan_placement("desk/python/2026-10-20-uv-basics.md", "![a](../shared/a.png)\n")
    assert placement.images == (ImageCopy("desk/shared/a.png", "posts/images/uv-basics/a.png"),)


def test_web_and_absolute_images_are_left_alone() -> None:
    text = "![w](https://example.test/a.png) ![r](/blog/a.png)\n"
    placement = plan_placement("desk/2026-10-20-uv-basics.md", text)
    assert placement.text == text
    assert placement.images == ()


def test_the_same_image_linked_twice_is_copied_once() -> None:
    placement = plan_placement("desk/2026-10-20-uv-basics.md", "![a](./images/a.png) ![a](./images/a.png)\n")
    assert len(placement.images) == 1


def test_two_different_images_with_the_same_name_are_refused() -> None:
    with pytest.raises(PlacementError, match="이미지 파일 이름이 겹침: a.png"):
        plan_placement("desk/2026-10-20-uv-basics.md", "![a](./one/a.png) ![b](./two/a.png)\n")


@pytest.mark.parametrize(
    ("action", "message"),
    [("add", "post: uv-basics"), ("update", "post: update uv-basics"), ("remove", "post: remove uv-basics")],
)
def test_commit_messages_say_what_happened_to_which_post(action: str, message: str) -> None:
    assert commit_message("uv-basics", action) == message


def test_log_files_are_named_by_start_time_then_slug() -> None:
    assert log_file_name(datetime(2026, 10, 20, 9, 5, 3), "uv-basics") == "20261020-090503_uv-basics.log"


def test_only_the_newest_logs_are_kept() -> None:
    names = [f"202610{day:02d}-000000_a.log" for day in range(1, 6)] + ["summary.jsonl"]
    assert logs_to_prune(names, keep=3) == ["20261001-000000_a.log", "20261002-000000_a.log"]


def test_post_url_joins_site_and_slug() -> None:
    assert post_url("https://tryfasting.github.io/blog/", "uv-basics") == "https://tryfasting.github.io/blog/uv-basics/"


@pytest.mark.parametrize(
    "remote",
    ["https://github.com/tryfasting/blog.git", "https://github.com/tryfasting/blog", "git@github.com:tryfasting/blog.git"],
)
def test_github_repo_is_read_from_the_remote_url(remote: str) -> None:
    assert github_repo(remote) == "tryfasting/blog"
