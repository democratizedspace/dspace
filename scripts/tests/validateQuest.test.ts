import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';
const validateQuest = require('../validate-quest');

describe('validateQuest script', () => {
  const validQuest = path.join(
    __dirname,
    '../../frontend/src/pages/quests/json/aquaria/walstad.json'
  );
  it('returns true for a valid quest file', () => {
    expect(validateQuest(validQuest)).toBe(true);
  });

  it('returns false for an invalid quest file', () => {
    const tempPath = path.join(__dirname, 'temp-invalid.json');
    fs.writeFileSync(tempPath, JSON.stringify({ title: 'invalid' }));
    const result = validateQuest(tempPath);
    fs.unlinkSync(tempPath);
    expect(result).toBe(false);
  });
});
