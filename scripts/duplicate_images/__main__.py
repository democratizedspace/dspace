"""CLI entrypoint for finding duplicate quest and item images."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Iterable, List

from . import (
    DuplicateImageError,
    ImageReference,
    build_image_reference_map,
    find_duplicates,
)

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_QUESTS_DIR = REPO_ROOT / "frontend" / "src" / "pages" / "quests" / "json"
DEFAULT_ITEMS_DIR = REPO_ROOT / "frontend" / "src" / "pages" / "inventory" / "json" / "items"


def parse_arguments(argv: Iterable[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Find duplicate quest and item image URLs so new assets can be generated for them."
        )
    )
    parser.add_argument(
        "command",
        choices=["find-duplicate-images"],
        help=("Run the duplicate image scanner. This is the default and only command."),
    )
    parser.add_argument(
        "--quests-dir",
        type=Path,
        default=DEFAULT_QUESTS_DIR,
        help="Directory containing quest JSON files (defaults to repo quests directory).",
    )
    parser.add_argument(
        "--items-dir",
        type=Path,
        default=DEFAULT_ITEMS_DIR,
        help="Directory containing item JSON files (defaults to repo items directory).",
    )
    parser.add_argument(
        "--repo-root",
        type=Path,
        default=REPO_ROOT,
        help="Root of the repository for printing relative file paths.",
    )
    return parser.parse_args(list(argv) if argv is not None else None)


def format_references(references: List[ImageReference], repo_root: Path) -> List[str]:
    lines: List[str] = []
    for reference in sorted(references, key=lambda ref: (str(ref.path), ref.identifier)):
        relative_path = _format_path(reference.path, repo_root)
        lines.append(f"  - {relative_path} :: {reference.identifier} [{reference.kind}]")
    return lines


def _format_path(path: Path, repo_root: Path) -> Path:
    try:
        return path.relative_to(repo_root)
    except ValueError:
        return path


def run_duplicate_image_scan(quests_dir: Path, items_dir: Path, repo_root: Path) -> str:
    mapping = build_image_reference_map(quests_dir, items_dir)
    duplicates = find_duplicates(mapping)

    if not duplicates:
        return "No duplicate images found."

    lines: List[str] = []
    for image in sorted(duplicates):
        references = duplicates[image]
        lines.append(f"{image} ({len(references)} uses)")
        lines.extend(format_references(references, repo_root))
    return "\n".join(lines)


def main(argv: Iterable[str] | None = None) -> int:
    args = parse_arguments(argv)

    try:
        output = run_duplicate_image_scan(args.quests_dir, args.items_dir, args.repo_root)
    except DuplicateImageError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1
    except OSError as exc:  # Includes FileNotFoundError and other IO errors
        print(f"Error reading files: {exc}", file=sys.stderr)
        return 1

    print(output)
    return 0


if __name__ == "__main__":
    sys.exit(main())
