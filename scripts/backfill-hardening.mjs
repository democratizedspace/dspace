import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const {
  DEFAULT_HARDENING,
  evaluateProcessQuality,
  evaluateQuestQuality,
  normalizeHardening,
  statusEmoji
} = require('./hardening.js');

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 4) + '\n');
}

function hardenQuest(filePath) {
  const quest = loadJson(filePath);
  const scoreFloor = evaluateQuestQuality(quest);
  const normalized = normalizeHardening(quest.hardening, { scoreFloor });
  const score = Math.max(normalized.score, scoreFloor);
  const hardening = { ...normalized, score, emoji: statusEmoji(normalized.passes, score) };
  quest.hardening = hardening;
  writeJson(filePath, quest);
}

function hardenQuests() {
  const questRoot = path.resolve(__dirname, '../frontend/src/pages/quests');
  const questDirs = [path.join(questRoot, 'json'), path.join(questRoot, 'templates')];
  questDirs.forEach((dir) => {
    if (!fs.existsSync(dir)) return;
    hardenQuestsInDir(dir);
  });
}

function hardenQuestsInDir(dir) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      hardenQuestsInDir(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      hardenQuest(fullPath);
    }
  });
}

function normalizeProcessHardening(processEntry) {
  const scoreFloor = evaluateProcessQuality(processEntry);
  const normalized = normalizeHardening(processEntry.hardening, { scoreFloor });
  const score = Math.max(normalized.score, scoreFloor);
  return { ...normalized, score, emoji: statusEmoji(normalized.passes, score) };
}

function hardenProcesses() {
  const basePath = path.resolve(__dirname, '../frontend/src/pages/processes/base.json');
  const hardeningDir = path.resolve(__dirname, '../frontend/src/pages/processes/hardening');
  const base = loadJson(basePath);

  const updatedBase = base.map((proc) => {
    const hardeningPath = path.join(hardeningDir, `${proc.id}.json`);
    const hadInlineHardening = Boolean(proc.hardening);
    const sourceHardening = fs.existsSync(hardeningPath)
      ? loadJson(hardeningPath)
      : proc.hardening || DEFAULT_HARDENING;
    const hardening = normalizeProcessHardening({ ...proc, hardening: sourceHardening });
    // Write normalized hardening file
    writeJson(hardeningPath, hardening);
    // Keep inline hardening for the base if it existed
    if (hadInlineHardening) {
      return { ...proc, hardening };
    }
    return { ...proc };
  });

  writeJson(basePath, updatedBase);
}

function main() {
  hardenQuests();
  hardenProcesses();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
