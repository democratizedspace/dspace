"""Command line interface for duplicate image detection.

The CLI scans quest and inventory JSON for ``image`` fields, reports duplicate references by
path, surfaces identical files that live at different paths under ``frontend/public``, and lists
missing assets referenced by quests or items.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Mapping, Sequence, TypeVar

from . import (
    DuplicateImageError,
    collect_image_references,
    find_duplicates,
    find_identical_files,
    find_missing_images,
    format_duplicates,
    serialize_report,
)

DEFAULT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_QUESTS_DIR = DEFAULT_ROOT / "frontend" / "src" / "pages" / "quests" / "json"
DEFAULT_ITEMS_DIR = (
    DEFAULT_ROOT / "frontend" / "src" / "pages" / "inventory" / "json" / "items"
)


def _positive_int(value: str) -> int:
    parsed = int(value)
    if parsed < 1:
        raise argparse.ArgumentTypeError("--image-count must be a positive integer")
    return parsed


TValue = TypeVar("TValue")


def _truncate_mapping(
    mapping: Mapping[str, TValue],
    image_count: int | None,
) -> dict[str, TValue]:
    if image_count is None:
        return dict(mapping)

    sorted_items = sorted(mapping.items(), key=lambda item: item[0])
    return dict(sorted_items[:image_count])


def _truncate_identical_files(
    identical_files: Mapping[str, list[str]],
    image_count: int | None,
) -> dict[str, list[str]]:
    if image_count is None:
        return {digest: list(paths) for digest, paths in identical_files.items()}

    truncated = _truncate_mapping(identical_files, image_count)
    return {
        digest: sorted(paths)[:image_count]
        for digest, paths in truncated.items()
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Analyze quest and item image usage for duplicates, identical files, and missing assets."
        ),
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    def add_common_arguments(subparser: argparse.ArgumentParser) -> None:
        subparser.add_argument(
            "--root",
            type=Path,
            default=DEFAULT_ROOT,
            help=(
                "Repository root used to make relative paths in the report and locate assets under "
                "frontend/public"
            ),
        )
        subparser.add_argument(
            "--quests-dir",
            type=Path,
            default=DEFAULT_QUESTS_DIR,
            help="Path to the quests JSON directory (default: frontend/src/pages/quests/json)",
        )
        subparser.add_argument(
            "--items-dir",
            type=Path,
            default=DEFAULT_ITEMS_DIR,
            help=(
                "Path to the inventory items JSON directory (default: "
                "frontend/src/pages/inventory/json/items)"
            ),
        )
        subparser.add_argument(
            "--json",
            action="store_true",
            help=(
                "Output results in JSON format for scripting, including duplicate paths, "
                "identical files, and missing assets"
            ),
        )
        subparser.add_argument(
            "--image-count",
            type=_positive_int,
            help=(
                "Optional maximum number of image entries to print per report section. "
                "If the report has fewer entries, all entries are shown."
            ),
        )

    analyze_parser = subparsers.add_parser(
        "find-image-issues",
        help="List duplicate images, identical files, and missing assets in one report",
    )
    add_common_arguments(analyze_parser)

    return parser


def main(argv: Sequence[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    try:
        usages = collect_image_references(args.quests_dir, args.items_dir, args.root)
        duplicates = find_duplicates(usages)
        identical_files = find_identical_files(usages, args.root)
        missing_images = find_missing_images(usages, args.root)

        duplicates = _truncate_mapping(duplicates, args.image_count)
        identical_files = _truncate_identical_files(identical_files, args.image_count)
        missing_images = _truncate_mapping(missing_images, args.image_count)

        if args.json:
            output = json.dumps(
                serialize_report(duplicates, identical_files, missing_images),
                indent=2,
            )
            print(output)
        else:
            output = format_duplicates(
                duplicates,
                identical_files,
                usages,
                missing_images,
            )
            if output:
                print(output)
            else:
                print("No image issues found.")
    except DuplicateImageError as err:
        parser.exit(status=1, message=f"error: {err}\n")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
