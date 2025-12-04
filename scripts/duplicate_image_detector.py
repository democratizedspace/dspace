#!/usr/bin/env python3
"""CLI utility to find duplicate quest and item images.

Scans local quest and item JSON under the repo root and reports image URLs used
more than once. Designed for quick, local inspection without network access.
"""
from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Mapping

QUESTS_DIR = Path("frontend/src/pages/quests/json")
ITEMS_DIR = Path("frontend/src/pages/inventory/json/items")


class DuplicateImageError(Exception):
    """Raised when parsing fails or directories are missing."""


@dataclass(frozen=True)
class Reference:
    kind: str
    path: Path
    image: str
    identifier: str

    def display(self, base_dir: Path) -> str:
        relative_path = self.path.relative_to(base_dir)
        return f"{relative_path} :: {self.identifier}"


@dataclass(frozen=True)
class DuplicateImage:
    image: str
    references: List[Reference]

    def sorted_references(self, base_dir: Path) -> List[Reference]:
        return sorted(
            self.references,
            key=lambda ref: (ref.path.relative_to(base_dir), ref.identifier),
        )


def load_json(path: Path) -> object:
    try:
        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    except json.JSONDecodeError as exc:  # pragma: no cover - exercised in tests via main()
        raise DuplicateImageError(f"Invalid JSON in {path}: {exc}") from exc


def collect_quest_references(path: Path) -> Iterable[Reference]:
    data = load_json(path)
    if not isinstance(data, Mapping):
        raise DuplicateImageError(f"Quest file {path} is not a JSON object")

    identifier = str(data.get("id") or data.get("title") or path.stem)
    image = data.get("image")
    if image:
        yield Reference(kind="quest", path=path, image=image, identifier=identifier)


def collect_item_references(path: Path) -> Iterable[Reference]:
    data = load_json(path)
    if not isinstance(data, list):
        raise DuplicateImageError(f"Item file {path} is not a JSON array")

    for entry in data:
        if not isinstance(entry, Mapping):
            raise DuplicateImageError(f"Item entry in {path} is not an object")
        image = entry.get("image")
        if not image:
            continue
        identifier = str(entry.get("id") or entry.get("name") or "unknown")
        yield Reference(kind="item", path=path, image=image, identifier=identifier)


def discover_files(base_dir: Path, target: Path) -> List[Path]:
    root = base_dir / target
    if not root.exists():
        raise DuplicateImageError(f"Directory not found: {root}")
    return sorted(root.rglob("*.json"))


def build_index(base_dir: Path) -> Dict[str, List[Reference]]:
    index: Dict[str, List[Reference]] = {}

    for quest_file in discover_files(base_dir, QUESTS_DIR):
        for reference in collect_quest_references(quest_file):
            index.setdefault(reference.image, []).append(reference)

    for item_file in discover_files(base_dir, ITEMS_DIR):
        for reference in collect_item_references(item_file):
            index.setdefault(reference.image, []).append(reference)

    return index


def find_duplicates(base_dir: Path) -> List[DuplicateImage]:
    index = build_index(base_dir)
    duplicates: List[DuplicateImage] = []
    for image, references in index.items():
        if len(references) > 1:
            duplicates.append(DuplicateImage(image=image, references=references))
    return sorted(duplicates, key=lambda entry: entry.image)


def format_duplicates(duplicates: List[DuplicateImage], base_dir: Path) -> str:
    if not duplicates:
        return "No duplicate images found."

    lines: List[str] = []
    for entry in duplicates:
        lines.append(f"{entry.image} ({len(entry.references)} uses)")
        for reference in entry.sorted_references(base_dir):
            lines.append(f"  - {reference.display(base_dir)}")
    return "\n".join(lines)


def parse_args(argv: List[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Find duplicate quest and item images.")
    parser.add_argument(
        "--base-dir",
        default=Path.cwd(),
        type=Path,
        help="Repository root (defaults to current working directory)",
    )
    return parser.parse_args(argv)


def main(argv: List[str] | None = None) -> int:
    args = parse_args(argv)
    base_dir = args.base_dir.resolve()

    try:
        duplicates = find_duplicates(base_dir)
        output = format_duplicates(duplicates, base_dir)
        print(output)
        return 0
    except DuplicateImageError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":  # pragma: no cover - exercised via CLI tests
    sys.exit(main())
