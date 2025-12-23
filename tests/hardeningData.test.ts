import fs from 'fs';
import { globSync } from 'glob';
import { describe, expect, it } from 'vitest';
import processes from '../frontend/src/generated/processes.json';
import {
  evaluateProcessQuality,
  evaluateQuestQuality,
  validateHardening
} from '../scripts/hardening.js';

const questFiles = globSync('frontend/src/pages/quests/json/**/*.json');

function loadQuest(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

describe('hardening metadata', () => {
  it('quests include valid hardening that meets evaluator scores', () => {
    questFiles.forEach((file) => {
      const quest = loadQuest(file);
      const hardeningCheck = validateHardening(quest.hardening);
      expect(hardeningCheck.valid).toBe(true);
      expect(quest.hardening.score).toBeGreaterThanOrEqual(evaluateQuestQuality(quest));
      expect(quest.hardening.passes).toBe(quest.hardening.history.length);
    });
  });

  it('processes include valid hardening that meets evaluator scores', () => {
    processes.forEach((proc) => {
      const hardeningCheck = validateHardening(proc.hardening);
      expect(hardeningCheck.valid).toBe(true);
      expect(proc.hardening.score).toBeGreaterThanOrEqual(evaluateProcessQuality(proc));
      expect(proc.hardening.passes).toBe(proc.hardening.history.length);
    });
  });
});
