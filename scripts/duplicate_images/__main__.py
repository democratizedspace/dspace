"""Command line interface for duplicate image detection.

The CLI scans quest and inventory JSON for ``image`` fields, reports duplicate references by
path, and surfaces identical files that live at different paths under ``frontend/public``.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Sequence

from . import (
    DuplicateImageError,
    collect_image_references,
    find_duplicates,
    find_identical_files,
    format_duplicates,
    serialize_report,
)

DEFAULT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_QUESTS_DIR = DEFAULT_ROOT / "frontend" / "src" / "pages" / "quests" / "json"
DEFAULT_ITEMS_DIR = (
    DEFAULT_ROOT / "frontend" / "src" / "pages" / "inventory" / "json" / "items"
)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Find quest and item entries that share image assets by path or identical file content."
        ),
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    find_parser = subparsers.add_parser(
        "find-duplicate-images",
        help="List duplicate image URLs across quests and items",
    )
    find_parser.add_argument(
        "--root",
        type=Path,
        default=DEFAULT_ROOT,
        help=(
            "Repository root used to make relative paths in the report and locate assets under "
            "frontend/public"
        ),
    )
    find_parser.add_argument(
        "--quests-dir",
        type=Path,
        default=DEFAULT_QUESTS_DIR,
        help="Path to the quests JSON directory (default: frontend/src/pages/quests/json)",
    )
    find_parser.add_argument(
        "--items-dir",
        type=Path,
        default=DEFAULT_ITEMS_DIR,
        help=(
            "Path to the inventory items JSON directory (default: "
            "frontend/src/pages/inventory/json/items)"
        ),
    )
    find_parser.add_argument(
        "--json",
        action="store_true",
        help=(
            "Output results in JSON format for scripting, including duplicate paths and "
            "identical files"
        ),
    )

    return parser


def main(argv: Sequence[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    try:
        usages = collect_image_references(args.quests_dir, args.items_dir, args.root)
        duplicates = find_duplicates(usages)
        identical_files = find_identical_files(usages.keys(), args.root)

        if args.json:
            output = json.dumps(
                serialize_report(duplicates, identical_files),
                indent=2,
            )
            print(output)
        else:
            output = format_duplicates(duplicates, identical_files, usages)
            if output:
                print(output)
            else:
                print("No duplicate images found.")
    except DuplicateImageError as err:
        parser.exit(status=1, message=f"error: {err}\n")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
