import json
from pathlib import Path

import pytest

from scripts.duplicate_image_detector import (
    DuplicateImageError,
    format_duplicates,
    find_duplicates,
)


def write_json(path: Path, content: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(content), encoding="utf-8")


def test_find_duplicates_collects_shared_images(tmp_path: Path):
    quest_path = tmp_path / "frontend/src/pages/quests/json/expedition/a.json"
    write_json(quest_path, {"id": "expedition/a", "image": "/assets/shared.png"})

    item_path = tmp_path / "frontend/src/pages/inventory/json/items/tools.json"
    write_json(
        item_path,
        [
            {"id": "tool-1", "image": "/assets/shared.png"},
            {"id": "tool-2", "image": "/assets/unique.png"},
        ],
    )

    duplicates = find_duplicates(tmp_path)

    assert len(duplicates) == 1
    duplicate = duplicates[0]
    assert duplicate.image == "/assets/shared.png"
    identifiers = sorted(reference.identifier for reference in duplicate.references)
    assert identifiers == ["expedition/a", "tool-1"]


def test_format_duplicates_outputs_reference_paths(tmp_path: Path):
    quest_path = tmp_path / "frontend/src/pages/quests/json/expedition/a.json"
    write_json(quest_path, {"id": "expedition/a", "image": "/assets/shared.png"})
    item_path = tmp_path / "frontend/src/pages/inventory/json/items/tools.json"
    write_json(item_path, [{"id": "tool-1", "image": "/assets/shared.png"}])

    output = format_duplicates(find_duplicates(tmp_path), tmp_path)

    assert "/assets/shared.png (2 uses)" in output
    assert "frontend/src/pages/quests/json/expedition/a.json" in output
    assert "frontend/src/pages/inventory/json/items/tools.json" in output


def test_invalid_quest_json_raises(tmp_path: Path):
    quest_path = tmp_path / "frontend/src/pages/quests/json/expedition/bad.json"
    quest_path.parent.mkdir(parents=True, exist_ok=True)
    quest_path.write_text("{invalid json", encoding="utf-8")

    with pytest.raises(DuplicateImageError):
        find_duplicates(tmp_path)
