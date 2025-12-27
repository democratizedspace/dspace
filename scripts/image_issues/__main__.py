"""CLI entrypoint for image issue detection (preferred alias)."""

from scripts.duplicate_images.__main__ import DEFAULT_ITEMS_DIR, DEFAULT_QUESTS_DIR, main

__all__ = ["DEFAULT_ITEMS_DIR", "DEFAULT_QUESTS_DIR", "main"]


if __name__ == "__main__":
    raise SystemExit(main())
