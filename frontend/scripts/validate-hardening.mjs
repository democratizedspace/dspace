import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import Ajv from 'ajv';
import {
    DEFAULT_HARDENING,
    evaluateProcessQuality,
    evaluateQuestQuality,
    normalizeHardening,
    validateHardening,
} from '../src/utils/hardening.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const ajv = new Ajv({ allErrors: true, strict: false });
const globModule = createRequire(import.meta.url)('glob');
const globSync = globModule.globSync ?? globModule.sync;
const hardeningSchema = JSON.parse(
    fs.readFileSync(path.join(root, 'src/pages/sharedSchemas/hardening.json'), 'utf8')
);
ajv.addSchema(hardeningSchema, hardeningSchema.$id);
const questSchema = JSON.parse(
    fs.readFileSync(path.join(root, 'src/pages/quests/jsonSchemas/quest.json'), 'utf8')
);
const processSchema = JSON.parse(
    fs.readFileSync(path.join(root, 'src/pages/processes/process.schema.json'), 'utf8')
);
const validateQuestSchema = ajv.compile(questSchema);
const validateProcessSchema = ajv.compile(processSchema);

const questFiles = globSync(path.join(root, 'src/pages/quests/json/**/*.json'));
const processBasePath = path.join(root, 'src/pages/processes/base.json');
const processHardeningDir = path.join(root, 'src/pages/processes/hardening');

const errors = [];

for (const questFile of questFiles) {
    const quest = JSON.parse(fs.readFileSync(questFile, 'utf8'));
    const expectedScore = evaluateQuestQuality(quest);
    const hardeningIssues = validateHardening(quest.hardening, expectedScore);
    if (!validateQuestSchema(quest)) {
        const detail = ajv.errorsText(validateQuestSchema.errors);
        errors.push(`Schema error in quest ${quest.id}: ${detail}`);
    }
    if (hardeningIssues.length > 0) {
        errors.push(`Hardening error in quest ${quest.id}: ${hardeningIssues.join('; ')}`);
    }
}

const processes = JSON.parse(fs.readFileSync(processBasePath, 'utf8'));
for (const process of processes) {
    const hardeningPath = path.join(processHardeningDir, `${process.id}.json`);
    const expectedScore = evaluateProcessQuality(process);
    const hardeningSource =
        process.hardening ?? (fs.existsSync(hardeningPath)
            ? JSON.parse(fs.readFileSync(hardeningPath, 'utf8'))
            : DEFAULT_HARDENING);
    const normalizedHardening = normalizeHardening(hardeningSource, { expectedScore });
    const processRecord = { ...process, hardening: normalizedHardening };

    if (!validateProcessSchema(processRecord)) {
        const detail = ajv.errorsText(validateProcessSchema.errors);
        errors.push(`Schema error in process ${process.id}: ${detail}`);
    }

    const hardeningIssues = validateHardening(normalizedHardening, expectedScore);
    if (hardeningIssues.length > 0) {
        errors.push(`Hardening error in process ${process.id}: ${hardeningIssues.join('; ')}`);
    }
}

if (errors.length > 0) {
    console.error('Hardening validation failed:');
    errors.forEach((err) => console.error(`- ${err}`));
    process.exit(1);
}

console.log('Hardening validation passed for quests and processes.');
