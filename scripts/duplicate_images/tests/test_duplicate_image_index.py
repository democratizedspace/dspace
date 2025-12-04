import json
from pathlib import Path

import pytest

from scripts.duplicate_images import (
    DuplicateImageError,
    build_image_index,
    collect_item_images,
    collect_quest_images,
    find_duplicates,
    format_duplicates,
)


def write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload), encoding="utf-8")


def test_collects_images_and_identifiers(tmp_path: Path) -> None:
    quest_path = tmp_path / "quests" / "alpha.json"
    item_path = tmp_path / "items" / "set" / "beta.json"

    write_json(quest_path, {"id": "alpha", "image": "/assets/alpha.jpg"})
    write_json(
        item_path,
        [
            {"id": "item-one", "image": "/assets/shared.jpg"},
            {"name": "item-two", "image": "/assets/unique.jpg"},
        ],
    )

    quests = list(collect_quest_images(quest_path))
    items = list(collect_item_images(item_path))

    assert quests[0].identifier == "alpha"
    assert items[0].identifier == "item-one"
    assert items[1].identifier == "item-two"


def test_builds_duplicate_map(tmp_path: Path) -> None:
    quests_dir = tmp_path / "quests"
    items_dir = tmp_path / "items"

    write_json(quests_dir / "first.json", {"id": "first", "image": "/assets/shared.jpg"})
    write_json(quests_dir / "second.json", {"id": "second", "image": "/assets/shared.jpg"})
    write_json(items_dir / "things.json", [{"id": "item", "image": "/assets/solo.jpg"}])

    image_index = build_image_index(quests_dir, items_dir)
    duplicates = find_duplicates(image_index)

    assert "/assets/shared.jpg" in duplicates
    assert "/assets/solo.jpg" not in duplicates
    assert {ref.identifier for ref in duplicates["/assets/shared.jpg"]} == {"first", "second"}


def test_formatting_lists_paths_and_kinds(tmp_path: Path) -> None:
    quests_dir = tmp_path / "quests"
    items_dir = tmp_path / "items"

    write_json(quests_dir / "first.json", {"id": "first", "image": "/assets/shared.jpg"})
    write_json(items_dir / "things.json", [{"id": "item", "image": "/assets/shared.jpg"}])

    duplicates = find_duplicates(build_image_index(quests_dir, items_dir))
    output = format_duplicates(duplicates, tmp_path)

    assert "/assets/shared.jpg (2 uses)" in output
    assert "quests/first.json" in output
    assert "items/things.json" in output
    assert "[quest]" in output
    assert "[item]" in output


def test_errors_for_invalid_json(tmp_path: Path) -> None:
    bad_file = tmp_path / "quests" / "broken.json"
    bad_file.parent.mkdir(parents=True, exist_ok=True)
    bad_file.write_text("{not-json}", encoding="utf-8")

    with pytest.raises(DuplicateImageError):
        list(collect_quest_images(bad_file))
