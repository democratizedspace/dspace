import fs from 'node:fs';
import path from 'node:path';
import { globSync } from 'glob';
import { describe, expect, it } from 'vitest';
import processes from '../frontend/src/generated/processes.json' assert { type: 'json' };
import {
  evaluateProcessQuality,
  evaluateQuestQuality,
  validateHardening,
} from '../frontend/src/utils/hardening.js';

const questFiles = globSync(path.join(__dirname, '../frontend/src/pages/quests/json/**/*.json'));

describe('hardening metadata coverage', () => {
  it('quests include hardening data that meets evaluator expectations', () => {
    const issues: string[] = [];

    for (const questFile of questFiles) {
      const quest = JSON.parse(fs.readFileSync(questFile, 'utf8'));
      const expectedScore = evaluateQuestQuality(quest);
      const validationIssues = validateHardening(quest.hardening, expectedScore);
      if (validationIssues.length > 0) {
        issues.push(`${quest.id}: ${validationIssues.join('; ')}`);
      }
    }

    if (issues.length > 0) {
      console.warn('Quest hardening issues:', issues);
    }
    expect(issues).toHaveLength(0);
  });

  it('processes include validated hardening blocks', () => {
    const issues: string[] = [];

    for (const process of processes as Array<any>) {
      const expectedScore = evaluateProcessQuality(process);
      const validationIssues = validateHardening(process.hardening, expectedScore);
      if (validationIssues.length > 0) {
        issues.push(`${process.id}: ${validationIssues.join('; ')}`);
      }
    }

    if (issues.length > 0) {
      console.warn('Process hardening issues:', issues);
    }
    expect(issues).toHaveLength(0);
  });
});
