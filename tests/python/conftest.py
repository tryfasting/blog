import sys
from pathlib import Path

# The publish tool lives in scripts/ (run with `uv run scripts/publish.py`), not in an installed package.
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts"))
