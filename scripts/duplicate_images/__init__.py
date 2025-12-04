"""Utilities for finding duplicate quest and item images."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Mapping


class DuplicateImageError(Exception):
    """Raised when duplicate image discovery fails due to invalid input."""


@dataclass(frozen=True)
class ImageReference:
    """Location that references an image asset."""

    path: Path
    identifier: str
    kind: str


def load_json(path: Path):
    """Load a JSON document, raising DuplicateImageError on failure."""

    try:
        with path.open(encoding="utf-8") as handle:
            return json.load(handle)
    except json.JSONDecodeError as exc:
        raise DuplicateImageError(f"Failed to parse JSON in {path}: {exc}") from exc


def build_image_reference_map(quests_dir: Path, items_dir: Path) -> Dict[str, List[ImageReference]]:
    """
    Build a mapping of image URL to references across quest and item JSON files.

    Returns a dictionary where keys are image URLs and values are lists of ImageReference.
    """

    mapping: Dict[str, List[ImageReference]] = {}
    _collect_quest_images(quests_dir, mapping)
    _collect_item_images(items_dir, mapping)
    return mapping


def find_duplicates(mapping: Mapping[str, Iterable[ImageReference]]) -> Dict[str, List[ImageReference]]:
    """Return only images referenced more than once."""

    duplicates: Dict[str, List[ImageReference]] = {}
    for image, references in mapping.items():
        reference_list = list(references)
        if len(reference_list) > 1:
            duplicates[image] = reference_list
    return duplicates


def _collect_quest_images(directory: Path, mapping: Dict[str, List[ImageReference]]) -> None:
    for json_path in sorted(directory.rglob("*.json")):
        data = load_json(json_path)
        if not isinstance(data, dict):
            raise DuplicateImageError(f"Quest file is not an object: {json_path}")

        image = data.get("image")
        if not image:
            continue

        identifier = str(data.get("id") or data.get("title") or json_path.stem)
        _append_reference(mapping, image, json_path, identifier, kind="quest")


def _collect_item_images(directory: Path, mapping: Dict[str, List[ImageReference]]) -> None:
    for json_path in sorted(directory.rglob("*.json")):
        data = load_json(json_path)
        if not isinstance(data, list):
            raise DuplicateImageError(f"Item file is not an array: {json_path}")

        for entry in data:
            if not isinstance(entry, dict):
                raise DuplicateImageError(f"Item entry is not an object: {json_path}")

            image = entry.get("image")
            if not image:
                continue

            identifier = str(entry.get("id") or entry.get("name") or "<unknown>")
            _append_reference(mapping, image, json_path, identifier, kind="item")


def _append_reference(
    mapping: Dict[str, List[ImageReference]], image: str, path: Path, identifier: str, kind: str
) -> None:
    mapping.setdefault(image, []).append(ImageReference(path=path, identifier=identifier, kind=kind))
