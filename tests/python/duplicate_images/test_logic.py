from __future__ import annotations

import json
from pathlib import Path
import shutil

import pytest

from scripts.duplicate_images import (
    DuplicateImageError,
    collect_image_references,
    find_duplicates,
    find_identical_files,
    format_duplicates,
)


def _write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def _copy_fixture_repo(tmp_path: Path) -> Path:
    repo_root = tmp_path / "repo"
    shutil.copytree(FIXTURE_ROOT, repo_root, dirs_exist_ok=True)
    return repo_root


FIXTURE_ROOT = Path(__file__).resolve().parents[2] / "data" / "duplicate_images"


def test_collects_duplicates_from_quests_and_items(tmp_path: Path) -> None:
    repo_root = tmp_path
    quests_dir = repo_root / "frontend" / "src" / "pages" / "quests" / "json"
    items_dir = repo_root / "frontend" / "src" / "pages" / "inventory" / "json" / "items"

    _write_json(
        quests_dir / "astronomy" / "andromeda.json",
        {"id": "astronomy/andromeda", "title": "Andromeda Quest", "image": "/assets/quests/solar.jpg"},
    )
    _write_json(
        quests_dir / "astrobiology" / "origin.json",
        {"id": "astrobiology/origin", "title": "Origin Quest", "image": "/assets/quests/solar.jpg"},
    )

    _write_json(
        items_dir / "tanks.json",
        [
            {"id": "tank-150", "name": "Tank 150", "image": "/assets/aquarium.jpg"},
            {"id": "tank-200", "name": "Tank 200", "image": "/assets/quests/solar.jpg"},
        ],
    )

    usages = collect_image_references(quests_dir, items_dir, repo_root)
    duplicates = find_duplicates(usages)

    assert "/assets/quests/solar.jpg" in duplicates
    references = duplicates["/assets/quests/solar.jpg"]
    assert sorted(ref.display_path() for ref in references) == [
        "frontend/src/pages/inventory/json/items/tanks.json",
        "frontend/src/pages/quests/json/astrobiology/origin.json",
        "frontend/src/pages/quests/json/astronomy/andromeda.json",
    ]

    formatted = format_duplicates(duplicates)
    assert "/assets/quests/solar.jpg (3 uses)" in formatted
    assert "Andromeda Quest" in formatted
    assert "astronomy/andromeda" in formatted
    assert "Tank 200" in formatted
    assert "tank-200" in formatted
    # Verify summary appears (3 uses - 1 = 2 duplicates)
    assert "Total duplicates remaining: 2" in formatted


def test_collect_image_references_requires_valid_json(tmp_path: Path) -> None:
    repo_root = tmp_path
    quests_dir = repo_root / "frontend" / "src" / "pages" / "quests" / "json"
    items_dir = repo_root / "frontend" / "src" / "pages" / "inventory" / "json" / "items"

    quests_dir.mkdir(parents=True, exist_ok=True)
    items_dir.mkdir(parents=True, exist_ok=True)

    (quests_dir / "broken.json").write_text("{ invalid", encoding="utf-8")

    with pytest.raises(DuplicateImageError):
        collect_image_references(quests_dir, items_dir, repo_root)


def test_identical_files_are_reported_by_content(tmp_path: Path) -> None:
    repo_root = _copy_fixture_repo(tmp_path)
    quests_dir = repo_root / "frontend" / "src" / "pages" / "quests" / "json"
    items_dir = repo_root / "frontend" / "src" / "pages" / "inventory" / "json" / "items"

    usages = collect_image_references(quests_dir, items_dir, repo_root)
    duplicates = find_duplicates(usages)
    identical_files = find_identical_files(usages.keys(), repo_root)

    assert "/assets/shared.png" in duplicates
    references = duplicates["/assets/shared.png"]
    assert sorted(ref.display_path() for ref in references) == [
        "frontend/src/pages/inventory/json/items/tools.json",
        "frontend/src/pages/quests/json/science/duplicate_path.json",
        "frontend/src/pages/quests/json/science/duplicate_second.json",
    ]

    assert len(identical_files) == 1
    digest, paths = next(iter(identical_files.items()))
    assert len(paths) == 2
    assert set(paths) == {"/assets/alias.png", "/assets/quests/alias.png"}
    assert len(digest) == 64

    formatted = format_duplicates(duplicates, identical_files)
    assert "Identical image files (same content, different paths):" in formatted
    assert "hash" in formatted
    assert "- /assets/alias.png" in formatted
    assert "- /assets/quests/alias.png" in formatted
    flattened_paths = {path for paths in identical_files.values() for path in paths}
    assert "/assets/duplicate-name.png" not in flattened_paths
