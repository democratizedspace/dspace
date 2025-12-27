"""Legacy shim for the image issues CLI.

Prefer importing :mod:`scripts.image_issues`.
"""
from __future__ import annotations

import warnings

from scripts.image_issues import (
    DuplicateImageError,
    ImageReference,
    collect_image_references,
    find_duplicates,
    find_identical_files,
    find_missing_images,
    format_duplicates,
    serialize_report,
)

warnings.warn(
    "scripts.duplicate_images is deprecated; use scripts.image_issues instead.",
    DeprecationWarning,
    stacklevel=2,
)

__all__ = [
    "DuplicateImageError",
    "ImageReference",
    "collect_image_references",
    "find_duplicates",
    "find_identical_files",
    "find_missing_images",
    "format_duplicates",
    "serialize_report",
]
