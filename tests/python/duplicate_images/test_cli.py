from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

from scripts.duplicate_images import (
    collect_image_references,
    find_duplicates,
    format_duplicates,
    serialize_duplicates,
)
from scripts.duplicate_images.__main__ import DEFAULT_ITEMS_DIR, DEFAULT_QUESTS_DIR


def _write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def test_cli_reports_duplicates(tmp_path: Path) -> None:
    quests_dir = tmp_path / "quests"
    items_dir = tmp_path / "items"

    _write_json(
        quests_dir / "science" / "sample.json",
        {"id": "science/sample", "image": "/assets/shared.png"},
    )
    _write_json(
        quests_dir / "science" / "secondary.json",
        {"id": "science/secondary", "image": "/assets/shared.png"},
    )
    _write_json(
        items_dir / "tools.json",
        [
            {"id": "tool-kit", "image": "/assets/shared.png"},
            {"id": "unique-tool", "image": "/assets/unique.png"},
        ],
    )

    command = [
        sys.executable,
        "-m",
        "scripts.duplicate_images",
        "find-duplicate-images",
        "--root",
        str(tmp_path),
        "--quests-dir",
        str(quests_dir),
        "--items-dir",
        str(items_dir),
    ]

    result = subprocess.run(command, capture_output=True, text=True, check=False)

    assert result.returncode == 0
    stdout = result.stdout
    assert "/assets/shared.png (3 uses)" in stdout
    assert "science/sample" in stdout
    assert "science/secondary" in stdout
    assert "tool-kit" in stdout
    assert "/assets/unique.png" not in stdout


def test_default_paths_are_exposed() -> None:
    assert DEFAULT_QUESTS_DIR.name == "json"
    assert DEFAULT_ITEMS_DIR.name == "items"


def test_cli_json_output(tmp_path: Path) -> None:
    """Test --json flag produces valid JSON matching the logic layer."""
    quests_dir = tmp_path / "quests"
    items_dir = tmp_path / "items"

    _write_json(
        quests_dir / "astronomy" / "andromeda.json",
        {"id": "astronomy/andromeda", "image": "/assets/quests/solar.jpg"},
    )
    _write_json(
        items_dir / "tanks.json",
        [
            {"id": "tank-200", "image": "/assets/quests/solar.jpg"},
        ],
    )

    command = [
        sys.executable,
        "-m",
        "scripts.duplicate_images",
        "find-duplicate-images",
        "--root",
        str(tmp_path),
        "--quests-dir",
        str(quests_dir),
        "--items-dir",
        str(items_dir),
        "--json",
    ]

    result = subprocess.run(command, capture_output=True, text=True, check=False)

    assert result.returncode == 0
    output = json.loads(result.stdout)

    # Validate structure matches expected JSON format
    assert "/assets/quests/solar.jpg" in output
    refs = output["/assets/quests/solar.jpg"]
    assert len(refs) == 2

    # Check quest reference
    quest_ref = next(r for r in refs if r["source"] == "quest")
    assert quest_ref["identifier"] == "astronomy/andromeda"
    assert "quests/astronomy/andromeda.json" in quest_ref["path"]

    # Check item reference
    item_ref = next(r for r in refs if r["source"] == "item")
    assert item_ref["identifier"] == "tank-200"
    assert "items/tanks.json" in item_ref["path"]


def test_cli_output_matches_logic_layer(tmp_path: Path) -> None:
    """Verify CLI output is a formatted view of the same data from logic layer."""
    quests_dir = tmp_path / "quests"
    items_dir = tmp_path / "items"

    _write_json(
        quests_dir / "science" / "sample.json",
        {"id": "science/sample", "image": "/assets/shared.png"},
    )
    _write_json(
        quests_dir / "science" / "secondary.json",
        {"id": "science/secondary", "image": "/assets/shared.png"},
    )
    _write_json(
        items_dir / "tools.json",
        [
            {"id": "tool-kit", "image": "/assets/shared.png"},
        ],
    )

    # Call logic layer directly
    usages = collect_image_references(quests_dir, items_dir, tmp_path)
    duplicates = find_duplicates(usages)

    # Get both text and JSON representations
    text_output = format_duplicates(duplicates)
    json_data = serialize_duplicates(duplicates)

    # Verify text output contains all the data from logic layer
    assert "/assets/shared.png" in duplicates
    assert len(duplicates["/assets/shared.png"]) == 3

    # Check text output has all identifiers
    assert "science/sample" in text_output
    assert "science/secondary" in text_output
    assert "tool-kit" in text_output

    # Check JSON output has same structure
    assert "/assets/shared.png" in json_data
    assert len(json_data["/assets/shared.png"]) == 3
    identifiers = {ref["identifier"] for ref in json_data["/assets/shared.png"]}
    assert identifiers == {"science/sample", "science/secondary", "tool-kit"}
