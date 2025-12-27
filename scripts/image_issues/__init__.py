"""Image issue analysis utilities (preferred alias of scripts.duplicate_images).

This module re-exports the duplicate image detection helpers under the ``scripts.image_issues``
namespace. The implementation remains in ``scripts.duplicate_images`` for backward compatibility.
"""

from scripts.duplicate_images import (
    DuplicateImageError,
    ImageReference,
    collect_image_references,
    count_total_duplicates,
    find_duplicates,
    find_identical_files,
    find_missing_images,
    format_duplicates,
    serialize_duplicates,
    serialize_report,
)

__all__ = [
    "DuplicateImageError",
    "ImageReference",
    "collect_image_references",
    "count_total_duplicates",
    "find_duplicates",
    "find_identical_files",
    "find_missing_images",
    "format_duplicates",
    "serialize_duplicates",
    "serialize_report",
]
