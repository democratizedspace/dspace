"""Legacy shim to run the image issues CLI under the old module name."""
from __future__ import annotations

import warnings

from scripts.image_issues.__main__ import (
    DEFAULT_ITEMS_DIR,
    DEFAULT_QUESTS_DIR,
    build_parser,
    main,
)

warnings.warn(
    "scripts.duplicate_images is deprecated; use scripts.image_issues instead.",
    DeprecationWarning,
    stacklevel=2,
)

__all__ = ["DEFAULT_ITEMS_DIR", "DEFAULT_QUESTS_DIR", "build_parser", "main"]

if __name__ == "__main__":
    raise SystemExit(main())
