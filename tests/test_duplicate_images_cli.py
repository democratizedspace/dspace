import subprocess
import sys
from pathlib import Path

from scripts.duplicate_images.__main__ import run_duplicate_image_scan


def create_fixtures(tmp_path: Path) -> tuple[Path, Path]:
    quests_dir = tmp_path / "frontend" / "src" / "pages" / "quests" / "json"
    items_dir = tmp_path / "frontend" / "src" / "pages" / "inventory" / "json" / "items"
    quests_dir.mkdir(parents=True)
    items_dir.mkdir(parents=True)

    (quests_dir / "alpha.json").write_text(
        '{"id": "quest/alpha", "image": "/assets/duplicate.jpg"}', encoding="utf-8"
    )
    (quests_dir / "beta.json").write_text(
        '{"id": "quest/beta", "image": "/assets/beta.jpg"}', encoding="utf-8"
    )

    (items_dir / "gear.json").write_text(
        '[{"id": "item-1", "image": "/assets/duplicate.jpg"},'
        ' {"id": "item-2", "image": "/assets/unique.jpg"}]',
        encoding="utf-8",
    )

    return quests_dir, items_dir


def test_cli_reports_duplicates(tmp_path: Path):
    quests_dir, items_dir = create_fixtures(tmp_path)
    repo_root = tmp_path

    result = subprocess.run(
        [
            sys.executable,
            "-m",
            "scripts.duplicate_images",
            "find-duplicate-images",
            "--quests-dir",
            str(quests_dir),
            "--items-dir",
            str(items_dir),
            "--repo-root",
            str(repo_root),
        ],
        capture_output=True,
        text=True,
        check=False,
        cwd=Path(__file__).resolve().parents[1],
    )

    assert result.returncode == 0
    stdout = result.stdout.strip()
    assert "/assets/duplicate.jpg (2 uses)" in stdout
    assert "quests/json/alpha.json" in stdout
    assert "inventory/json/items/gear.json" in stdout
    assert "/assets/beta.jpg" not in stdout
    assert "/assets/unique.jpg" not in stdout


def test_run_duplicate_image_scan_returns_text(tmp_path: Path):
    quests_dir, items_dir = create_fixtures(tmp_path)
    output = run_duplicate_image_scan(quests_dir, items_dir, repo_root=tmp_path)

    assert "/assets/duplicate.jpg (2 uses)" in output
    assert "[quest]" in output
    assert "[item]" in output
