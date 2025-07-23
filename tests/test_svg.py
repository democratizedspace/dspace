from lxml import etree
from pathlib import Path


def test_svgs_parse():
    for svg_path in Path('assets/svg').rglob('*.svg'):
        etree.parse(str(svg_path))
