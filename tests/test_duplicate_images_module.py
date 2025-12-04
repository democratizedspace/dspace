from pathlib import Path

import pytest

from scripts.duplicate_images import (
    DuplicateImageError,
    build_image_reference_map,
    find_duplicates,
)


def test_builds_reference_map_and_finds_duplicates(tmp_path: Path):
    quests_dir = tmp_path / "quests"
    items_dir = tmp_path / "items"
    quests_dir.mkdir()
    items_dir.mkdir()

    (quests_dir / "mission.json").write_text(
        '{"id": "mission/alpha", "image": "/assets/shared.jpg"}', encoding="utf-8"
    )
    (quests_dir / "unique.json").write_text(
        '{"id": "mission/beta", "image": "/assets/unique.jpg"}', encoding="utf-8"
    )

    (items_dir / "gear.json").write_text(
        '[{"id": "item-1", "image": "/assets/shared.jpg"},'
        ' {"id": "item-2", "image": "/assets/solo.jpg"}]',
        encoding="utf-8",
    )

    mapping = build_image_reference_map(quests_dir, items_dir)
    duplicates = find_duplicates(mapping)

    assert set(duplicates.keys()) == {"/assets/shared.jpg"}
    references = duplicates["/assets/shared.jpg"]
    identifiers = {ref.identifier for ref in references}
    assert identifiers == {"mission/alpha", "item-1"}


def test_raises_for_invalid_json(tmp_path: Path):
    quests_dir = tmp_path / "quests"
    items_dir = tmp_path / "items"
    quests_dir.mkdir()
    items_dir.mkdir()

    (quests_dir / "broken.json").write_text("{not valid json}", encoding="utf-8")

    with pytest.raises(DuplicateImageError):
        build_image_reference_map(quests_dir, items_dir)
