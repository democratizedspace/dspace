from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

root_str = str(REPO_ROOT)
if root_str not in sys.path:
    sys.path.insert(0, root_str)
