"""Command line interface for duplicate image detection.

The CLI scans quest and inventory JSON for ``image`` fields, reports duplicate references by
path, surfaces identical files that live at different paths under ``frontend/public``, and lists
missing assets referenced by quests or items.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Mapping, Sequence

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

def _apply_global_image_count(
    duplicates: Mapping[str, object],
    identical_files: Mapping[str, list[str]],
    missing_images: Mapping[str, object],
    image_count: int | None,
) -> tuple[dict[str, object], dict[str, list[str]], dict[str, object]]:
    if image_count is None:
        return (
            dict(duplicates),
            {digest: list(paths) for digest, paths in identical_files.items() if len(paths) > 1},
            dict(missing_images),
        )

    remaining = image_count
    truncated_duplicates: dict[str, object] = {}
    for image in sorted(duplicates):
        if remaining == 0:
            break
        truncated_duplicates[image] = duplicates[image]
        remaining -= 1

    truncated_identical_files: dict[str, list[str]] = {}
    for digest in sorted(identical_files):
        if remaining == 0:
            break
        paths = list(identical_files[digest])
        if len(paths) > 1:
            truncated_identical_files[digest] = paths
            remaining -= 1

    truncated_missing_images: dict[str, object] = {}
    for image in sorted(missing_images):
        if remaining == 0:
            break
        truncated_missing_images[image] = missing_images[image]
        remaining -= 1

    return truncated_duplicates, truncated_identical_files, truncated_missing_images


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
            type=int,
            default=None,
            help=(
                "Optional maximum number of top-level image issue report entries. "
                "When provided, output is truncated to the first N sorted entries in "
                "report order: duplicates, identical files, then missing images."
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

    if args.image_count is not None and args.image_count <= 0:
        parser.error("--image-count must be a positive integer")

    try:
        usages = collect_image_references(args.quests_dir, args.items_dir, args.root)
        duplicates = find_duplicates(usages)
        identical_files = find_identical_files(usages, args.root)
        missing_images = find_missing_images(usages, args.root)

        duplicates, identical_files, missing_images = _apply_global_image_count(
            duplicates,
            identical_files,
            missing_images,
            args.image_count,
        )

        if args.json:
            output = json.dumps(
                serialize_report(duplicates, identical_files, missing_images),
                indent=2,
            )
            print(output)
        else:
            output = format_duplicates(duplicates, identical_files, usages, missing_images)
            if output:
                print(output)
            else:
                print("No image issues found.")
    except DuplicateImageError as err:
        parser.exit(status=1, message=f"error: {err}\n")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
