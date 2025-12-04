"""Duplicate image detector for quest and item assets.

This module reports two categories of duplication:
* Multiple entities (quests or items) referencing the same image path string.
* Distinct image paths that point to byte-identical files on disk (under frontend/public).
"""

from __future__ import annotations

from collections import defaultdict
import hashlib
import json
from dataclasses import dataclass
from pathlib import Path
from typing import DefaultDict, Dict, Iterable, List, Set

ImageMap = Dict[str, List["ImageReference"]]
ContentDuplicateMap = Dict[str, List[str]]


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


def _iter_existing_image_paths(image_paths: Iterable[str], repo_root: Path) -> Iterable[tuple[str, Path]]:
    """Yield image path strings paired with real files that exist on disk.

    The input values come directly from JSON `image` fields (e.g. "/assets/foo.jpg").
    We strip the leading slash and resolve them relative to the repository root to locate
    files under ``frontend/public``. Missing files are ignored so callers can still
    report duplicates by path even when an asset has not been added yet.
    """

    seen: Set[str] = set()
    for image_path in image_paths:
        if image_path in seen:
            continue
        seen.add(image_path)

        relative_path = image_path.lstrip("/")
        candidate_paths = [
            repo_root / "frontend" / "public" / relative_path,
            repo_root / relative_path,
        ]
        for disk_path in candidate_paths:
            if disk_path.is_file():
                yield image_path, disk_path
                break


def _hash_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(8192), b""):
            digest.update(chunk)
    return digest.hexdigest()


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


def find_identical_files(
    image_paths: Iterable[str], repo_root: Path
) -> ContentDuplicateMap:
    """Group image paths that resolve to identical files by their SHA-256 hash."""

    hash_to_paths: DefaultDict[str, List[str]] = defaultdict(list)

    for image_path, disk_path in _iter_existing_image_paths(image_paths, repo_root):
        file_hash = _hash_file(disk_path)
        hash_to_paths[file_hash].append(image_path)

    return {
        file_hash: sorted(paths) for file_hash, paths in hash_to_paths.items() if len(paths) > 1
    }


def count_total_duplicates(duplicates: ImageMap) -> int:
    """Calculate total number of duplicate image uses.

    For each duplicate image URI used N times, there are (N - 1) duplicates.
    Total = sum of (uses - 1) for all duplicate URIs.
    """
    return sum(len(references) - 1 for references in duplicates.values())


def format_duplicates(
    duplicates: ImageMap, identical_files: ContentDuplicateMap | None = None
) -> str:
    if not duplicates and not identical_files:
        return ""

    lines: List[str] = []
    if duplicates:
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

        # Add summary at the bottom
        total_duplicates = count_total_duplicates(duplicates)
        lines.append("")
        lines.append(f"Total duplicates remaining: {total_duplicates}")

    if identical_files:
        if lines:
            lines.append("")
        lines.append("Identical image files (same content, different paths):")
        for file_hash in sorted(identical_files):
            lines.append(f"hash {file_hash}:")
            for path in sorted(identical_files[file_hash]):
                lines.append(f"  - {path}")

    return "\n".join(lines)


def serialize_duplicates(
    duplicates: ImageMap, identical_files: ContentDuplicateMap | None = None
) -> Dict[str, List[Dict[str, str | None]] | Dict[str, List[str]]]:
    """Convert duplicate image mappings to JSON-serializable format.

    The returned mapping preserves the original duplicate-by-path data and, when provided,
    appends an ``identical_files`` section that groups paths whose on-disk bytes match.
    """

    result: Dict[str, List[Dict[str, str | None]] | Dict[str, List[str]]] = {}
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

    if identical_files:
        result["identical_files"] = {hash_: sorted(paths) for hash_, paths in identical_files.items()}

    return result
