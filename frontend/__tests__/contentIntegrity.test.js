/**
 * @jest-environment node
 */
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const questDir = path.join(__dirname, '../src/pages/quests/json');
const itemsFile = path.join(__dirname, '../src/pages/inventory/json/items.json');
const processesFile = path.join(__dirname, '../src/pages/processes/processes.json');

const BASELINES = {
  quests: 22,
  items: 90,
  processes: 36,
};

describe('Content integrity', () => {
  test('minimum quest count is maintained', () => {
    const quests = glob.sync(path.join(questDir, '**/*.json'));
    expect(quests.length).toBeGreaterThanOrEqual(BASELINES.quests);
  });

  test('minimum item count is maintained', () => {
    const items = JSON.parse(fs.readFileSync(itemsFile));
    expect(items.length).toBeGreaterThanOrEqual(BASELINES.items);
  });

  test('minimum process count is maintained', () => {
    const processes = JSON.parse(fs.readFileSync(processesFile));
    expect(processes.length).toBeGreaterThanOrEqual(BASELINES.processes);
  });
});
