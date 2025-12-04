"""Duplicate image detector for quest and item assets."""

from __future__ import annotations

from collections import defaultdict
import json
from dataclasses import dataclass
from pathlib import Path
from typing import DefaultDict, Dict, Iterable, List

ImageMap = Dict[str, List["ImageReference"]]


class DuplicateImageError(Exception):
    """Raised when the duplicate image detection cannot complete."""


@dataclass(frozen=True)
class ImageReference:
    """Represents a single usage of an image asset."""

    source: str
    identifier: str
    file_path: Path
    image: str
    name: str | None = None

    def display_path(self) -> str:
        return self.file_path.as_posix()


def _load_json(path: Path) -> object:
    try:
        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    except json.JSONDecodeError as err:
        raise DuplicateImageError(f"Invalid JSON in {path}: {err}") from err
    except OSError as err:
        raise DuplicateImageError(f"Failed to read {path}: {err}") from err


def _ensure_directory(path: Path, label: str) -> None:
    if not path.is_dir():
        raise DuplicateImageError(f"{label} directory not found: {path}")


def _relative_to_root(path: Path, repo_root: Path) -> Path:
    try:
        return path.relative_to(repo_root)
    except ValueError:
        return path


def _quest_reference(path: Path, repo_root: Path) -> Iterable[ImageReference]:
    data = _load_json(path)
    if not isinstance(data, dict):
        raise DuplicateImageError(f"Quest file {path} must contain a JSON object.")

    image = data.get("image")
    if not isinstance(image, str) or not image:
        return []

    identifier = str(data.get("id") or data.get("title") or path.stem)
    name = data.get("title")
    name = name if isinstance(name, str) else None
    return [
        ImageReference(
            source="quest",
            identifier=identifier,
            file_path=_relative_to_root(path, repo_root),
            image=image,
            name=name,
        )
    ]


def _item_references(path: Path, repo_root: Path) -> Iterable[ImageReference]:
    data = _load_json(path)
    if not isinstance(data, list):
        raise DuplicateImageError(
            f"Item file {path} must contain a JSON array of item objects."
        )

    references: List[ImageReference] = []
    for index, entry in enumerate(data):
        if not isinstance(entry, dict):
            continue
        image = entry.get("image")
        if not isinstance(image, str) or not image:
            continue
        identifier = str(entry.get("id") or entry.get("name") or f"item-{index}")
        name = entry.get("name")
        name = name if isinstance(name, str) else None
        references.append(
            ImageReference(
                source="item",
                identifier=identifier,
                file_path=_relative_to_root(path, repo_root),
                image=image,
                name=name,
            )
        )
    return references


def _append_references(
    mapping: DefaultDict[str, List[ImageReference]],
    references: Iterable[ImageReference],
) -> None:
    for reference in references:
        mapping[reference.image].append(reference)


def collect_image_references(
    quests_dir: Path, items_dir: Path, repo_root: Path
) -> ImageMap:
    """Return a map of image URLs to their quest/item references.

    This is a stable entrypoint for tests and future CI gates.
    It remains side-effect-free (pure function over paths).
    """

    _ensure_directory(quests_dir, "Quest")
    _ensure_directory(items_dir, "Item")

    mapping: DefaultDict[str, List[ImageReference]] = defaultdict(list)

    for quest_path in sorted(quests_dir.rglob("*.json")):
        _append_references(mapping, _quest_reference(quest_path, repo_root))

    for item_path in sorted(items_dir.rglob("*.json")):
        _append_references(mapping, _item_references(item_path, repo_root))

    return dict(mapping)


def find_duplicates(usages: ImageMap) -> ImageMap:
    """Filter image references to only those used more than once.

    This is a stable entrypoint for tests and future CI gates.
    It remains side-effect-free (pure function over mappings).
    """
    return {image: refs for image, refs in usages.items() if len(refs) > 1}


def format_duplicates(duplicates: ImageMap) -> str:
    if not duplicates:
        return ""

    lines: List[str] = []
    for image in sorted(duplicates):
        references = sorted(
            duplicates[image],
            key=lambda ref: (ref.source, ref.display_path(), ref.identifier),
        )
        lines.append(f"{image} ({len(references)} uses)")
        for reference in references:
            if reference.name:
                lines.append(
                    f"  - {reference.display_path()} :: {reference.name} - {reference.identifier} [{reference.source}]"
                )
            else:
                lines.append(
                    f"  - {reference.display_path()} :: {reference.identifier} [{reference.source}]"
                )
    return "\n".join(lines)


def serialize_duplicates(
    duplicates: ImageMap,
) -> Dict[str, List[Dict[str, str | None]]]:
    """Convert duplicate image mappings to JSON-serializable format."""
    result: Dict[str, List[Dict[str, str | None]]] = {}
    for image, references in duplicates.items():
        result[image] = [
            {
                "source": ref.source,
                "identifier": ref.identifier,
                "path": ref.display_path(),
                "name": ref.name,
            }
            for ref in references
        ]
    return result
