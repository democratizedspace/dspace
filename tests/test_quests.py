import re
import yaml
from pathlib import Path

MEASURE_RE = re.compile(r"\d+\s*(?:N·m|V|mV|A|mm)")

def test_quest_tasks_have_images_and_measures():
    for yaml_path in Path('quests').glob('*.yaml'):
        with open(yaml_path, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
        assert 'tasks' in data, f'{yaml_path} missing tasks'
        for task in data['tasks']:
            resources = task.get('resources', [])
            assert resources, f'{yaml_path}:{task.get("id")} lacks resources'
            accepts = task.get('acceptance', '')
            assert MEASURE_RE.search(accepts), f'{yaml_path}:{task.get("id")} lacks measurement in acceptance'
