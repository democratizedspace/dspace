import json
import subprocess
from pathlib import Path


def write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload), encoding="utf-8")


def test_cli_reports_duplicates(tmp_path: Path) -> None:
    quests_dir = tmp_path / "quests"
    items_dir = tmp_path / "items"

    write_json(quests_dir / "one.json", {"id": "one", "image": "/assets/dup.jpg"})
    write_json(quests_dir / "two.json", {"id": "two", "image": "/assets/unique.jpg"})
    write_json(items_dir / "set.json", [{"id": "item", "image": "/assets/dup.jpg"}])

    command = [
        "python",
        "-m",
        "scripts.duplicate_images",
        "find-duplicate-images",
        "--quests-dir",
        str(quests_dir),
        "--items-dir",
        str(items_dir),
    ]
    result = subprocess.run(command, capture_output=True, text=True, check=False)

    assert result.returncode == 0
    assert "/assets/dup.jpg (2 uses)" in result.stdout
    assert "quests/one.json" in result.stdout
    assert "items/set.json" in result.stdout
    assert "/assets/unique.jpg" not in result.stdout
