from __future__ import annotations

import json
import shutil
from pathlib import Path

import pytest

from scripts.duplicate_images import (
    DuplicateImageError,
    collect_image_references,
    find_duplicates,
    find_identical_files,
    format_duplicates,
    serialize_report,
)


FIXTURE_ROOT = Path(__file__).parents[2] / "data" / "duplicate_images"


def _write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def _copy_fixture_repo(destination: Path) -> tuple[Path, Path, Path]:
    shutil.copytree(FIXTURE_ROOT, destination, dirs_exist_ok=True)
    quests_dir = destination / "frontend" / "src" / "pages" / "quests" / "json"
    items_dir = destination / "frontend" / "src" / "pages" / "inventory" / "json" / "items"
    return destination, quests_dir, items_dir


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
    assert "Duplicate image reference total: 2" in formatted
    assert "Total duplicates across sections: 2" in formatted


def test_includes_descriptions_in_output_and_serialization(tmp_path: Path) -> None:
    repo_root = tmp_path
    quests_dir = repo_root / "frontend" / "src" / "pages" / "quests" / "json"
    items_dir = repo_root / "frontend" / "src" / "pages" / "inventory" / "json" / "items"

    quest_description = "Hydrate rockwool cubes before planting seeds."
    item_description = "Rockwool starter plug soaked and ready."

    _write_json(
        quests_dir / "hydroponics" / "prep.json",
        {
            "id": "hydroponics/prep",
            "title": "Hydroponics Prep",
            "description": quest_description,
            "image": "/assets/rockwool_wet.jpg",
        },
    )

    _write_json(
        items_dir / "hydroponics.json",
        [
            {
                "id": "rockwool-prepped",
                "name": "Soaked Rockwool Plug",
                "description": item_description,
                "image": "/assets/rockwool_wet.jpg",
            },
            {
                "id": "rockwool-dry",
                "name": "Dry Rockwool Plug",
                "image": "/assets/rockwool_wet.jpg",
            },
        ],
    )

    usages = collect_image_references(quests_dir, items_dir, repo_root)
    duplicates = find_duplicates(usages)

    assert "/assets/rockwool_wet.jpg" in duplicates
    formatted = format_duplicates(duplicates)

    assert '    - "Hydrate rockwool cubes before planting seeds."' in formatted
    assert '    - "Rockwool starter plug soaked and ready."' in formatted
    assert "Dry Rockwool Plug" in formatted
    assert '"Dry Rockwool Plug"' not in formatted  # no description line for missing description

    serialized = serialize_report(duplicates)
    refs = serialized["duplicates"]["/assets/rockwool_wet.jpg"]
    description_by_id = {ref["identifier"]: ref["description"] for ref in refs}
    assert description_by_id["hydroponics/prep"] == quest_description
    assert description_by_id["rockwool-prepped"] == item_description
    assert description_by_id["rockwool-dry"] is None


def test_reports_identical_files_by_content(tmp_path: Path) -> None:
    repo_root, quests_dir, items_dir = _copy_fixture_repo(tmp_path)

    duplicate_quest_path = quests_dir / "beta" / "duplicate.json"
    duplicate_quest = json.loads(duplicate_quest_path.read_text(encoding="utf-8"))
    duplicate_quest["description"] = "Description for duplicate-content quest."
    duplicate_quest_path.write_text(json.dumps(duplicate_quest, indent=2), encoding="utf-8")

    tools_path = items_dir / "tools.json"
    tools_data = json.loads(tools_path.read_text(encoding="utf-8"))
    for entry in tools_data:
        if entry.get("id") == "duplicate-kit":
            entry["description"] = "Description for duplicate-content kit."
    tools_path.write_text(json.dumps(tools_data, indent=2), encoding="utf-8")

    usages = collect_image_references(quests_dir, items_dir, repo_root)
    duplicates = find_duplicates(usages)
    identical = find_identical_files(usages, repo_root)

    # Duplicate paths by string
    assert "/assets/shared-path.jpg" in duplicates
    shared_refs = duplicates["/assets/shared-path.jpg"]
    assert len(shared_refs) == 2

    # Identical bytes across different paths
    assert len(identical) == 1
    digest, entries = next(iter(identical.items()))
    assert len(entries) == 2
    assert {entry.path for entry in entries} == {
        "/assets/duplicate-content.jpg",
        "/assets/quests/duplicate-content.jpg",
    }
    assert len(digest) == 64  # sha256 hex length

    # Same filename but different bytes should not be grouped
    conflict_paths = {"/assets/conflict.jpg", "/assets/quests/conflict.jpg"}
    identical_paths = {entry.path for paths in identical.values() for entry in paths}
    assert conflict_paths.isdisjoint(identical_paths)

    formatted = format_duplicates(duplicates, identical)
    assert "Identical image files (same content, different paths):" in formatted
    assert "/assets/duplicate-content.jpg" in formatted
    assert "/assets/quests/duplicate-content.jpg" in formatted
    assert "Identical image content duplicates total: 1" in formatted
    assert "Duplicate image reference total: 1" in formatted
    assert "Total duplicates across sections: 2" in formatted
    assert '      - "Description for duplicate-content quest."' in formatted
    assert '      - "Description for duplicate-content kit."' in formatted


def test_collect_image_references_requires_valid_json(tmp_path: Path) -> None:
    repo_root = tmp_path
    quests_dir = repo_root / "frontend" / "src" / "pages" / "quests" / "json"
    items_dir = repo_root / "frontend" / "src" / "pages" / "inventory" / "json" / "items"

    quests_dir.mkdir(parents=True, exist_ok=True)
    items_dir.mkdir(parents=True, exist_ok=True)

    (quests_dir / "broken.json").write_text("{ invalid", encoding="utf-8")

    with pytest.raises(DuplicateImageError):
        collect_image_references(quests_dir, items_dir, repo_root)
