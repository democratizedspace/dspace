from __future__ import annotations

import json
from pathlib import Path

import pytest

from scripts.duplicate_images import (
    DuplicateImageError,
    collect_image_references,
    find_duplicates,
    format_duplicates,
)


def _write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


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
