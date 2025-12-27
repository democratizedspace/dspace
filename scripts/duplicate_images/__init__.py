"""Image analysis utilities for quest and item assets.

The module scans quest JSON under ``frontend/src/pages/quests/json`` and inventory item JSON
under ``frontend/src/pages/inventory/json/items`` to locate ``image`` fields. It reports
duplicate usages by the path strings in JSON, groups images that are byte-identical on
disk even when referenced by different paths under ``frontend/public``, and surfaces missing
assets referenced by quests or items.
"""

from __future__ import annotations

import hashlib
import json
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import DefaultDict, Dict, Iterable, List, Mapping
from urllib.parse import urlparse

ImageMap = Dict[str, List["ImageReference"]]
IdenticalImageMap = Dict[str, List[str]]


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
    description: str | None = None

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


def _hash_file(path: Path) -> str:
    hasher = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(8192), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


def _filesystem_path_for_image(image: str, repo_root: Path) -> Path | None:
    if image.startswith("//"):
        return None

    parsed = urlparse(image)
    if parsed.scheme and parsed.scheme != "file":
        return None

    relative_path = parsed.path.lstrip("/") if parsed.path else image.lstrip("/")
    if not relative_path:
        return None

    return repo_root / "frontend" / "public" / relative_path


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
    description = data.get("description")
    description = description if isinstance(description, str) else None
    return [
        ImageReference(
            source="quest",
            identifier=identifier,
            file_path=_relative_to_root(path, repo_root),
            image=image,
            name=name,
            description=description,
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
        description = entry.get("description")
        description = description if isinstance(description, str) else None
        references.append(
            ImageReference(
                source="item",
                identifier=identifier,
                file_path=_relative_to_root(path, repo_root),
                image=image,
                name=name,
                description=description,
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


def find_identical_files(usages: Mapping[str, List[ImageReference]], repo_root: Path) -> IdenticalImageMap:
    """Group image paths that point to identical files on disk.

    Paths that do not resolve to files under ``frontend/public`` are ignored to keep
    path-based duplicate detection intact even when assets are missing locally.
    """

    content_map: DefaultDict[str, List[str]] = defaultdict(list)
    for image in sorted(usages):
        filesystem_path = _filesystem_path_for_image(image, repo_root)
        if filesystem_path is None or not filesystem_path.is_file():
            continue

        try:
            digest = _hash_file(filesystem_path)
        except OSError:
            # If we cannot read the file, skip content comparison without
            # interrupting path-based duplicate detection.
            continue

        content_map[digest].append(image)

    return {digest: paths for digest, paths in content_map.items() if len(paths) > 1}


def count_total_duplicates(duplicates: ImageMap) -> int:
    """Calculate total number of duplicate image uses.

    For each duplicate image URI used N times, there are (N - 1) duplicates.
    Total = sum of (uses - 1) for all duplicate URIs.
    """
    return sum(len(references) - 1 for references in duplicates.values())


def find_missing_images(usages: Mapping[str, List[ImageReference]], repo_root: Path) -> ImageMap:
    """Return image references whose assets are not present on disk."""
    missing_map: DefaultDict[str, List[ImageReference]] = defaultdict(list)

    for image, references in usages.items():
        filesystem_path = _filesystem_path_for_image(image, repo_root)
        if filesystem_path is None:
            continue
        if not filesystem_path.is_file():
            missing_map[image].extend(references)

    return dict(missing_map)


def format_duplicates(
    duplicates: ImageMap,
    identical_files: IdenticalImageMap | None = None,
    all_references: ImageMap | None = None,
    missing_images: ImageMap | None = None,
) -> str:
    duplicates = duplicates or {}
    identical_files = identical_files or {}
    all_references = all_references or {}
    missing_images = missing_images or {}
    if not duplicates and not identical_files and not missing_images:
        return ""

    path_duplicate_count = count_total_duplicates(duplicates)
    identical_duplicate_count = 0
    missing_reference_count = 0
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
            if reference.description:
                lines.append(f'    - "{reference.description}"')

    if identical_files:
        lines.append("")
        lines.append("Identical image files (same content, different paths):")
        for digest in sorted(identical_files):
            lines.append(f"hash {digest}:")
            for path in sorted(identical_files[digest]):
                references = sorted(
                    all_references.get(path, []),
                    key=lambda ref: (ref.source, ref.display_path(), ref.identifier),
                )
                lines.append(f"  - {path} ({len(references)} uses)")
                for reference in references:
                    if reference.name:
                        lines.append(
                            f"    - {reference.display_path()} :: {reference.name} - {reference.identifier} "
                            f"[{reference.source}]"
                        )
                    else:
                        lines.append(
                            f"    - {reference.display_path()} :: {reference.identifier} [{reference.source}]"
                        )
                    if reference.description:
                        lines.append(f'      - "{reference.description}"')
            identical_duplicate_count += max(0, len(identical_files[digest]) - 1)

    if missing_images:
        lines.append("")
        lines.append(
            "Missing image files (referenced in data but not found under frontend/public):"
        )
        for image in sorted(missing_images):
            references = sorted(
                missing_images[image],
                key=lambda ref: (ref.source, ref.display_path(), ref.identifier),
            )
            lines.append(f"{image} ({len(references)} references)")
            for reference in references:
                if reference.name:
                    lines.append(
                        f"  - {reference.display_path()} :: {reference.name} - "
                        f"{reference.identifier} [{reference.source}]"
                    )
                else:
                    lines.append(
                        f"  - {reference.display_path()} :: {reference.identifier} "
                        f"[{reference.source}]"
                    )
                if reference.description:
                    lines.append(f'    - "{reference.description}"')
            missing_reference_count += len(references)

    if duplicates:
        lines.append("")
        lines.append(f"Total path-based duplicates: {path_duplicate_count}")

    if identical_files:
        lines.append("")
        lines.append(f"Total identical-file duplicates: {identical_duplicate_count}")

    if duplicates or identical_files:
        overall_total = path_duplicate_count + identical_duplicate_count
        lines.append("")
        lines.append(f"Total duplicates remaining: {overall_total}")

    if missing_images:
        lines.append("")
        lines.append(f"Total missing images: {missing_reference_count}")

    if duplicates or identical_files or missing_images:
        overall_total = (
            path_duplicate_count + identical_duplicate_count + missing_reference_count
        )
        lines.append("")
        lines.append(f"Total image issue occurrences: {overall_total}")

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
                "description": ref.description,
            }
            for ref in references
        ]
    return result


def serialize_report(
    duplicates: ImageMap,
    identical_files: Mapping[str, List[str]] | None = None,
    missing_images: ImageMap | None = None,
) -> Dict[str, object]:
    return {
        "duplicates": serialize_duplicates(duplicates),
        "identicalFiles": {
            digest: list(paths) for digest, paths in (identical_files or {}).items()
        },
        "missingImages": serialize_duplicates(missing_images or {}),
    }
