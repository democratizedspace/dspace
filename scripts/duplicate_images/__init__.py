"""Duplicate image detection for quest and item assets."""

from __future__ import annotations

from dataclasses import dataclass
import argparse
import json
import os
from pathlib import Path
from typing import Dict, Iterable, List, Sequence
import sys


class DuplicateImageError(Exception):
    """Raised when duplicate image scanning encounters a recoverable error."""


@dataclass(frozen=True)
class ImageReference:
    image: str
    kind: str
    identifier: str
    path: Path

    def display_path(self, base: Path) -> str:
        try:
            return str(self.path.relative_to(base))
        except ValueError:
            return str(self.path)


def load_json(path: Path) -> object:
    try:
        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    except json.JSONDecodeError as exc:
        raise DuplicateImageError(f"{path}: invalid JSON ({exc.msg})") from exc
    except OSError as exc:
        raise DuplicateImageError(f"{path}: unable to read file ({exc.strerror})") from exc


def collect_quest_images(path: Path) -> Iterable[ImageReference]:
    data = load_json(path)
    if not isinstance(data, dict):
        raise DuplicateImageError(f"{path}: expected a JSON object for quest content")

    image = data.get("image")
    if not image:
        return []

    identifier = str(
        data.get("id")
        or data.get("slug")
        or data.get("title")
        or data.get("name")
        or path.stem
    )
    yield ImageReference(image=image, kind="quest", identifier=identifier, path=path)


def collect_item_images(path: Path) -> Iterable[ImageReference]:
    data = load_json(path)
    if not isinstance(data, list):
        raise DuplicateImageError(f"{path}: expected a JSON array of items")

    for entry in data:
        if not isinstance(entry, dict):
            raise DuplicateImageError(f"{path}: item entries must be JSON objects")

        image = entry.get("image")
        if not image:
            continue

        identifier = str(
            entry.get("id")
            or entry.get("name")
            or entry.get("title")
            or entry.get("slug")
            or "<unknown>"
        )
        yield ImageReference(image=image, kind="item", identifier=identifier, path=path)


def build_image_index(quests_dir: Path, items_dir: Path) -> Dict[str, List[ImageReference]]:
    image_index: Dict[str, List[ImageReference]] = {}

    for quest_path in sorted(quests_dir.rglob("*.json")):
        if quest_path.is_file():
            for ref in collect_quest_images(quest_path):
                image_index.setdefault(ref.image, []).append(ref)

    for item_path in sorted(items_dir.rglob("*.json")):
        if item_path.is_file():
            for ref in collect_item_images(item_path):
                image_index.setdefault(ref.image, []).append(ref)

    return image_index


def find_duplicates(image_index: Dict[str, List[ImageReference]]) -> Dict[str, List[ImageReference]]:
    duplicates: Dict[str, List[ImageReference]] = {}
    for image, refs in image_index.items():
        if len(refs) > 1:
            duplicates[image] = sorted(refs, key=lambda ref: (ref.path, ref.identifier))
    return dict(sorted(duplicates.items(), key=lambda item: item[0]))


def format_duplicates(duplicates: Dict[str, Sequence[ImageReference]], base_path: Path) -> str:
    lines: List[str] = []
    for image, refs in duplicates.items():
        lines.append(f"{image} ({len(refs)} uses)")
        for ref in refs:
            lines.append(
                f"  - {ref.display_path(base_path)} :: {ref.identifier} [{ref.kind}]"
            )
    return "\n".join(lines)


def create_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Find duplicate quest and item images under the v3 content directories."
        )
    )
    parser.add_argument(
        "command",
        choices=["find-duplicate-images"],
        help="Run the duplicate image detector."
    )
    parser.add_argument(
        "--quests-dir",
        type=Path,
        default=Path("frontend/src/pages/quests/json"),
        help="Path to the quests JSON directory (defaults to the v3 quests tree)."
    )
    parser.add_argument(
        "--items-dir",
        type=Path,
        default=Path("frontend/src/pages/inventory/json/items"),
        help="Path to the items JSON directory (defaults to the v3 items tree)."
    )
    return parser


def run_detector(quests_dir: Path, items_dir: Path) -> int:
    repo_root = Path(__file__).resolve().parents[2]
    quests_dir = quests_dir.resolve()
    items_dir = items_dir.resolve()

    if repo_root in quests_dir.parents and repo_root in items_dir.parents:
        base_path = repo_root
    else:
        try:
            base_path = Path(os.path.commonpath([quests_dir, items_dir]))
        except ValueError:
            base_path = repo_root

    image_index = build_image_index(quests_dir, items_dir)
    duplicates = find_duplicates(image_index)

    if duplicates:
        output = format_duplicates(duplicates, base_path)
        print(output)
    else:
        print("No duplicate images found.")
    return 0


def main(argv: Sequence[str] | None = None) -> int:
    parser = create_parser()
    args = parser.parse_args(argv)

    try:
        return run_detector(args.quests_dir, args.items_dir)
    except DuplicateImageError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1


__all__ = [
    "DuplicateImageError",
    "ImageReference",
    "build_image_index",
    "collect_item_images",
    "collect_quest_images",
    "create_parser",
    "find_duplicates",
    "format_duplicates",
    "main",
    "run_detector",
]
