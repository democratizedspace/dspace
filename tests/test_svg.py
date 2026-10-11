from lxml import etree
from pathlib import Path


def test_svgs_parse():
    solar_dir = Path(__file__).resolve().parents[1] / 'frontend/public/assets/quests/solar'
    svg_paths = sorted(solar_dir.glob('*.svg'))
    assert [path.name for path in svg_paths] == [f'step{step}.svg' for step in range(1, 6)]
    for svg_path in svg_paths:
        etree.parse(str(svg_path))
