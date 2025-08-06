import { describe, it, expect, vi } from 'vitest';
const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
const {
  validateStagedQuests,
  getStagedQuestFiles,
} = require('../validate-staged-quests');

const validQuest = path.join(
  __dirname,
  '../../frontend/src/pages/quests/json/aquaria/walstad.json'
);

describe('validate-staged-quests', () => {
  it('returns true for valid staged quest files', () => {
    expect(validateStagedQuests([validQuest])).toBe(true);
  });

  it('returns false when a staged quest file is invalid', () => {
    const temp = path.join(__dirname, 'temp-invalid.json');
    fs.writeFileSync(temp, JSON.stringify({ title: 'invalid' }));
    const result = validateStagedQuests([temp]);
    fs.unlinkSync(temp);
    expect(result).toBe(false);
  });

  it('getStagedQuestFiles only returns quest JSON files', () => {
    const spy = vi
      .spyOn(child_process, 'execSync')
      .mockReturnValue(
        'frontend/src/pages/quests/json/aquaria/walstad.json\nfrontend/README.md\n'
      );
    const files = getStagedQuestFiles();
    expect(files).toEqual([
      'frontend/src/pages/quests/json/aquaria/walstad.json',
    ]);
    spy.mockRestore();
  });
});
