import subprocess
import sys
from pathlib import Path

FIXTURE_ROOT = Path(__file__).parent / "fixtures" / "duplicate_images"


def test_cli_reports_duplicates_from_fixture():
    result = subprocess.run(
        [sys.executable, "-m", "scripts.duplicate_image_detector", "--base-dir", str(FIXTURE_ROOT)],
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0

    output = result.stdout.strip().splitlines()
    assert "/assets/shared.jpg (2 uses)" in output
    assert any("space/alpha.json" in line for line in output)
    assert any("inventory/json/items/tools.json" in line for line in output)
    assert all("unique" not in line for line in output if line.startswith("/assets"))


def test_cli_handles_invalid_json():
    broken_dir = FIXTURE_ROOT / "broken"
    broken_path = broken_dir / "frontend/src/pages/quests/json/space/broken.json"
    broken_path.parent.mkdir(parents=True, exist_ok=True)
    broken_path.write_text("{bad json", encoding="utf-8")

    items_path = broken_dir / "frontend/src/pages/inventory/json/items/placeholder.json"
    items_path.parent.mkdir(parents=True, exist_ok=True)
    items_path.write_text("[]", encoding="utf-8")

    result = subprocess.run(
        [sys.executable, "-m", "scripts.duplicate_image_detector", "--base-dir", str(broken_dir)],
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 1
    assert "Invalid JSON" in result.stderr
