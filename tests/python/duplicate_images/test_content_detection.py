from __future__ import annotations

import shutil
from pathlib import Path

from scripts.duplicate_images import (
    collect_image_references,
    find_duplicates,
    find_identical_files,
    format_duplicates,
)


FIXTURE_ROOT = Path(__file__).resolve().parents[2] / "data" / "duplicate_images"


def _copy_fixture(tmp_path: Path) -> Path:
    repo_root = tmp_path / "repo"
    shutil.copytree(FIXTURE_ROOT, repo_root)
    return repo_root


def test_reports_path_duplicates_and_identical_files(tmp_path: Path) -> None:
    repo_root = _copy_fixture(tmp_path)
    quests_dir = repo_root / "frontend" / "src" / "pages" / "quests" / "json"
    items_dir = repo_root / "frontend" / "src" / "pages" / "inventory" / "json" / "items"

    usages = collect_image_references(quests_dir, items_dir, repo_root)
    duplicates = find_duplicates(usages)
    identical_files = find_identical_files(usages.keys(), repo_root)

    assert "/assets/shared.jpg" in duplicates
    assert len(duplicates["/assets/shared.jpg"]) == 2

    assert any(
        sorted(paths) == ["/assets/copies/shared.jpg", "/assets/shared.jpg"]
        for paths in identical_files.values()
    )

    output = format_duplicates(duplicates, identical_files)
    assert "Identical image files (same content, different paths):" in output
    assert "/assets/shared.jpg" in output
    assert "/assets/copies/shared.jpg" in output


def test_different_bytes_are_not_grouped(tmp_path: Path) -> None:
    repo_root = _copy_fixture(tmp_path)
    quests_dir = repo_root / "frontend" / "src" / "pages" / "quests" / "json"
    items_dir = repo_root / "frontend" / "src" / "pages" / "inventory" / "json" / "items"

    usages = collect_image_references(quests_dir, items_dir, repo_root)
    identical_files = find_identical_files(usages.keys(), repo_root)

    for paths in identical_files.values():
        assert "/assets/other/same-name.jpg" not in paths
        assert "/assets/same-name.jpg" not in paths
