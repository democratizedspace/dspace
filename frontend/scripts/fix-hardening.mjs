import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import {
    DEFAULT_HARDENING,
    evaluateProcessQuality,
    evaluateQuestQuality,
    normalizeHardening,
    validateHardening,
} from '../src/utils/hardening.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const globModule = createRequire(import.meta.url)('glob');
const globSync = globModule.globSync ?? globModule.sync;

const writeJson = (filePath, data) => {
    fs.writeFileSync(filePath, `${JSON.stringify(data, null, 4)}\n`);
};

const questFiles = globSync(path.join(root, 'src/pages/quests/json/**/*.json'));
const processHardeningDir = path.join(root, 'src/pages/processes/hardening');
const processBasePath = path.join(root, 'src/pages/processes/base.json');
const processHardeningWrites = { updated: 0, created: 0 };

let questUpdates = 0;
let processUpdates = 0;

for (const questFile of questFiles) {
    const quest = JSON.parse(fs.readFileSync(questFile, 'utf8'));
    const expectedScore = evaluateQuestQuality(quest);
    const normalizedHardening = normalizeHardening(quest.hardening ?? DEFAULT_HARDENING, {
        expectedScore,
    });
    const before = JSON.stringify(quest);
    quest.hardening = normalizedHardening;
    const after = JSON.stringify(quest);
    if (before !== after) {
        writeJson(questFile, quest);
        questUpdates += 1;
    }

    const issues = validateHardening(quest.hardening, expectedScore);
    if (issues.length > 0) {
        console.warn(`Quest ${quest.id} has hardening issues: ${issues.join('; ')}`);
    }
}

const processes = JSON.parse(fs.readFileSync(processBasePath, 'utf8'));
for (const process of processes) {
    const hardeningPath = path.join(processHardeningDir, `${process.id}.json`);
    const expectedScore = evaluateProcessQuality(process);

    const before = JSON.stringify(process);
    let hardening = DEFAULT_HARDENING;
    if (process.hardening) {
        hardening = process.hardening;
    } else if (fs.existsSync(hardeningPath)) {
        hardening = JSON.parse(fs.readFileSync(hardeningPath, 'utf8'));
    }

    const normalizedHardening = normalizeHardening(hardening, { expectedScore });
    process.hardening = normalizedHardening;

    if (JSON.stringify(process) !== before) {
        processUpdates += 1;
    }

    const issues = validateHardening(normalizedHardening, expectedScore);
    if (issues.length > 0) {
        console.warn(`Process ${process.id} hardening issues: ${issues.join('; ')}`);
    }

    const hardeningJson = `${JSON.stringify(normalizedHardening, null, 4)}\n`;
    if (fs.existsSync(hardeningPath)) {
        const existing = fs.readFileSync(hardeningPath, 'utf8');
        if (existing !== hardeningJson) {
            fs.writeFileSync(hardeningPath, hardeningJson);
            processHardeningWrites.updated += 1;
        }
    } else {
        fs.writeFileSync(hardeningPath, hardeningJson);
        processHardeningWrites.created += 1;
    }
}

writeJson(processBasePath, processes);

console.log(
    JSON.stringify(
        {
            questsNormalized: questUpdates,
            processesNormalized: processUpdates,
            processHardeningFilesUpdated: processHardeningWrites.updated,
            processHardeningFilesCreated: processHardeningWrites.created,
        },
        null,
        2
    )
);
