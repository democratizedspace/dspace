from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

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
