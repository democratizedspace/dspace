from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path

from scripts.duplicate_images import (
    collect_image_references,
    find_duplicates,
    find_identical_files,
    format_duplicates,
    serialize_report,
)
from scripts.duplicate_images.__main__ import DEFAULT_ITEMS_DIR, DEFAULT_QUESTS_DIR

FIXTURE_ROOT = Path(__file__).parents[2] / "data" / "duplicate_images"


def _write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def test_cli_reports_duplicates(tmp_path: Path) -> None:
    quests_dir = tmp_path / "quests"
    items_dir = tmp_path / "items"

    _write_json(
        quests_dir / "science" / "sample.json",
        {
            "id": "science/sample",
            "title": "Sample Quest",
            "description": "Description for sample quest.",
            "image": "/assets/shared.png",
        },
    )
    _write_json(
        quests_dir / "science" / "secondary.json",
        {
            "id": "science/secondary",
            "title": "Secondary Quest",
            "description": "Description for secondary quest.",
            "image": "/assets/shared.png",
        },
    )
    _write_json(
        items_dir / "tools.json",
        [
            {
                "id": "tool-kit",
                "name": "Tool Kit",
                "description": "Description for toolkit item.",
                "image": "/assets/shared.png",
            },
            {"id": "unique-tool", "name": "Unique Tool", "image": "/assets/unique.png"},
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
    assert "Sample Quest" in stdout
    assert "science/sample" in stdout
    assert "Secondary Quest" in stdout
    assert "science/secondary" in stdout
    assert "Tool Kit" in stdout
    assert "tool-kit" in stdout
    assert '    - "Description for sample quest."' in stdout
    assert '    - "Description for secondary quest."' in stdout
    assert '    - "Description for toolkit item."' in stdout
    assert "/assets/unique.png" not in stdout
    # Verify summary appears (3 uses - 1 = 2 duplicates)
    assert "Total duplicates remaining: 2" in stdout


def test_default_paths_are_exposed() -> None:
    assert DEFAULT_QUESTS_DIR.name == "json"
    assert DEFAULT_ITEMS_DIR.name == "items"


def test_cli_json_output(tmp_path: Path) -> None:
    """Test --json flag produces valid JSON matching the logic layer."""
    repo_root = tmp_path
    quests_dir = repo_root / "frontend" / "src" / "pages" / "quests" / "json"
    items_dir = repo_root / "frontend" / "src" / "pages" / "inventory" / "json" / "items"

    # Include identical files with real content and a duplicate path reference
    shutil.copytree(FIXTURE_ROOT, repo_root, dirs_exist_ok=True)

    command = [
        sys.executable,
        "-m",
        "scripts.duplicate_images",
        "find-duplicate-images",
        "--root",
        str(repo_root),
        "--quests-dir",
        str(quests_dir),
        "--items-dir",
        str(items_dir),
        "--json",
    ]

    result = subprocess.run(command, capture_output=True, text=True, check=False)

    assert result.returncode == 0
    output = json.loads(result.stdout)

    assert set(output.keys()) == {"duplicates", "identicalFiles"}

    duplicate_map = output["duplicates"]
    assert "/assets/shared-path.jpg" in duplicate_map
    refs = duplicate_map["/assets/shared-path.jpg"]
    assert len(refs) == 2
    assert all("description" in ref for ref in refs)

    quest_ref = next(r for r in refs if r["source"] == "quest")
    assert quest_ref["identifier"] == "alpha/shared"
    assert quest_ref["name"] == "Shared Path Quest"
    assert quest_ref["description"] == "Quest fixture description for shared image."
    assert "quests/json/alpha/shared.json" in quest_ref["path"]

    item_ref = next(r for r in refs if r["source"] == "item")
    assert item_ref["identifier"] == "shared-tool"
    assert item_ref["name"] == "Shared Tool"
    assert item_ref["description"] == "Item fixture description for shared image."
    assert "items/tools.json" in item_ref["path"]

    identical_files = output["identicalFiles"]
    assert len(identical_files) == 1
    digest, paths = next(iter(identical_files.items()))
    assert len(digest) == 64
    assert set(paths) == {"/assets/duplicate-content.jpg", "/assets/quests/duplicate-content.jpg"}


def test_cli_output_matches_logic_layer(tmp_path: Path) -> None:
    """Verify CLI output is a formatted view of the same data from logic layer."""
    quests_dir = tmp_path / "quests"
    items_dir = tmp_path / "items"

    _write_json(
        quests_dir / "science" / "sample.json",
        {
            "id": "science/sample",
            "title": "Sample Quest",
            "description": "Description for sample quest.",
            "image": "/assets/shared.png",
        },
    )
    _write_json(
        quests_dir / "science" / "secondary.json",
        {
            "id": "science/secondary",
            "title": "Secondary Quest",
            "description": "Description for secondary quest.",
            "image": "/assets/shared.png",
        },
    )
    _write_json(
        items_dir / "tools.json",
        [
            {
                "id": "tool-kit",
                "name": "Tool Kit",
                "description": "Description for toolkit item.",
                "image": "/assets/shared.png",
            },
        ],
    )

    # Call logic layer directly
    usages = collect_image_references(quests_dir, items_dir, tmp_path)
    duplicates = find_duplicates(usages)
    identical = find_identical_files(usages.keys(), tmp_path)

    # Get both text and JSON representations
    text_output = format_duplicates(duplicates, identical)
    json_data = serialize_report(duplicates, identical)

    # Verify text output contains all the data from logic layer
    assert "/assets/shared.png" in duplicates
    assert len(duplicates["/assets/shared.png"]) == 3

    # Check text output has all identifiers and names
    assert "Sample Quest" in text_output
    assert "science/sample" in text_output
    assert "Secondary Quest" in text_output
    assert "science/secondary" in text_output
    assert "Tool Kit" in text_output
    assert "tool-kit" in text_output
    assert '    - "Description for sample quest."' in text_output
    assert '    - "Description for secondary quest."' in text_output
    assert '    - "Description for toolkit item."' in text_output

    # Check JSON output has same structure
    assert "duplicates" in json_data
    assert "/assets/shared.png" in json_data["duplicates"]
    assert len(json_data["duplicates"]["/assets/shared.png"]) == 3
    identifiers = {ref["identifier"] for ref in json_data["duplicates"]["/assets/shared.png"]}
    assert identifiers == {"science/sample", "science/secondary", "tool-kit"}
    names = {
        ref["name"] for ref in json_data["duplicates"]["/assets/shared.png"] if ref["name"]
    }
    assert names == {"Sample Quest", "Secondary Quest", "Tool Kit"}
    descriptions = {
        ref["identifier"]: ref["description"] for ref in json_data["duplicates"]["/assets/shared.png"]
    }
    assert descriptions["science/sample"] == "Description for sample quest."
    assert descriptions["science/secondary"] == "Description for secondary quest."
    assert descriptions["tool-kit"] == "Description for toolkit item."

    assert json_data["identicalFiles"] == {}

    # Verify summary appears (3 uses - 1 = 2 duplicates)
    assert "Total duplicates remaining: 2" in text_output
