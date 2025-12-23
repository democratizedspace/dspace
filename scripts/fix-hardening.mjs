import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';
import hardening from '../common/hardening.js';

const QUEST_GLOB = 'frontend/src/pages/quests/json/**/*.json';
const PROCESS_BASE = 'frontend/src/pages/processes/base.json';
const PROCESS_HARDENING_DIR = 'frontend/src/pages/processes/hardening';

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 4) + '\n');
}

function normalizeQuestHardening(filePath) {
  const quest = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const evaluationScore = hardening.evaluateQuestQuality(quest);
  quest.hardening = hardening.normalizeHardening(quest.hardening ?? hardening.defaultHardening, {
    minimumScore: evaluationScore,
  });
  writeJson(filePath, quest);
  return quest.hardening;
}

function normalizeProcesses() {
  const processes = JSON.parse(fs.readFileSync(PROCESS_BASE, 'utf8'));
  fs.mkdirSync(PROCESS_HARDENING_DIR, { recursive: true });

  for (const proc of processes) {
    const hardeningPath = path.join(PROCESS_HARDENING_DIR, `${proc.id}.json`);
    const fileHardening = fs.existsSync(hardeningPath)
      ? JSON.parse(fs.readFileSync(hardeningPath, 'utf8'))
      : undefined;
    const evaluationScore = hardening.evaluateProcessQuality(proc);
    const normalized = hardening.normalizeHardening(
      fileHardening ?? proc.hardening ?? hardening.defaultHardening,
      { minimumScore: evaluationScore }
    );
    proc.hardening = normalized;
    writeJson(hardeningPath, normalized);
  }

  writeJson(PROCESS_BASE, processes);
  return processes.length;
}

function normalizeQuests() {
  const questFiles = globSync(QUEST_GLOB, { ignore: ['**/templates/*.json'] });
  let updated = 0;
  for (const file of questFiles) {
    normalizeQuestHardening(file);
    updated += 1;
  }
  return updated;
}

function run() {
  const questsUpdated = normalizeQuests();
  const processesUpdated = normalizeProcesses();
  console.log(`Normalized hardening for ${questsUpdated} quests and ${processesUpdated} processes.`);
}

run();
