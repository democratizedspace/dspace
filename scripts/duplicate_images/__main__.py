"""Command line interface for duplicate image detection."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Sequence

from . import (
    DuplicateImageError,
    collect_image_references,
    find_duplicates,
    format_duplicates,
    serialize_duplicates,
)

DEFAULT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_QUESTS_DIR = DEFAULT_ROOT / "frontend" / "src" / "pages" / "quests" / "json"
DEFAULT_ITEMS_DIR = (
    DEFAULT_ROOT / "frontend" / "src" / "pages" / "inventory" / "json" / "items"
)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Find quest and item entries that share image assets."
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
        help="Repository root used to make relative paths in the report",
    )
    find_parser.add_argument(
        "--quests-dir",
        type=Path,
        default=DEFAULT_QUESTS_DIR,
        help="Path to the quests JSON directory",
    )
    find_parser.add_argument(
        "--items-dir",
        type=Path,
        default=DEFAULT_ITEMS_DIR,
        help="Path to the inventory items JSON directory",
    )
    find_parser.add_argument(
        "--json",
        action="store_true",
        help="Output results in JSON format for scripting",
    )

    return parser


def main(argv: Sequence[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    try:
        usages = collect_image_references(args.quests_dir, args.items_dir, args.root)
        duplicates = find_duplicates(usages)

        if args.json:
            output = json.dumps(serialize_duplicates(duplicates), indent=2)
            print(output)
        else:
            output = format_duplicates(duplicates)
            if output:
                print(output)
            else:
                print("No duplicate images found.")
    except DuplicateImageError as err:
        parser.exit(status=1, message=f"error: {err}\n")
    except (TypeError, ValueError) as err:
        parser.exit(status=1, message=f"error: failed to serialize output: {err}\n")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
