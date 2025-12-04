from __future__ import annotations

import shutil
from pathlib import Path

import pytest

from scripts.duplicate_images import (
    collect_image_references,
    find_duplicates,
    find_identical_files,
)

FIXTURE_ROOT = Path(__file__).parent / "data" / "duplicate_images"


@pytest.fixture
def repo_root(tmp_path: Path) -> Path:
    repo_root = tmp_path / "repo"
    shutil.copytree(FIXTURE_ROOT, repo_root)
    return repo_root


def _paths(repo_root: Path) -> tuple[Path, Path]:
    quests_dir = repo_root / "frontend" / "src" / "pages" / "quests" / "json"
    items_dir = (
        repo_root / "frontend" / "src" / "pages" / "inventory" / "json" / "items"
    )
    return quests_dir, items_dir


def test_duplicate_image_paths_detected(repo_root: Path) -> None:
    quests_dir, items_dir = _paths(repo_root)

    usages = collect_image_references(quests_dir, items_dir, repo_root)
    duplicates = find_duplicates(usages)

    assert "/assets/shared.jpg" in duplicates
    identifiers = {ref.identifier for ref in duplicates["/assets/shared.jpg"]}
    assert identifiers == {"quest-one", "quest-two", "item-shared"}


def test_identical_files_reported_by_hash(repo_root: Path) -> None:
    quests_dir, items_dir = _paths(repo_root)

    usages = collect_image_references(quests_dir, items_dir, repo_root)
    identical_files = find_identical_files(usages.keys(), repo_root)

    matching_group = {
        "/assets/identical_a.jpg",
        "/assets/quests/identical_b.jpg",
    }
    assert any(set(paths) == matching_group for paths in identical_files.values())


def test_different_bytes_not_grouped(repo_root: Path) -> None:
    quests_dir, items_dir = _paths(repo_root)

    usages = collect_image_references(quests_dir, items_dir, repo_root)
    identical_files = find_identical_files(usages.keys(), repo_root)

    different_bytes_group = {
        "/assets/unique_name.jpg",
        "/assets/quests/unique_name.jpg",
    }
    assert not any(set(paths) == different_bytes_group for paths in identical_files.values())
