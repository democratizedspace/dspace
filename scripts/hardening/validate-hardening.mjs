import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Ajv from 'ajv';
import {
    validateHardening,
    evaluateQuestQuality,
    evaluateProcessQuality,
    computeEmoji,
    readJson,
} from './utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..', '..');

const hardeningSchema = readJson(path.join(root, 'frontend/src/pages/shared/hardening.schema.json'));
const questSchema = readJson(path.join(root, 'frontend/src/pages/quests/jsonSchemas/quest.json'));
const processSchema = readJson(path.join(root, 'frontend/src/pages/processes/jsonSchemas/process.json'));

const ajv = new Ajv({ allErrors: true });
ajv.addSchema(hardeningSchema);
const validateQuestSchema = ajv.compile(questSchema);
const validateProcessSchema = ajv.compile(processSchema);

const questDir = path.join(root, 'frontend/src/pages/quests/json');
const processBasePath = path.join(root, 'frontend/src/pages/processes/base.json');
const processHardeningDir = path.join(root, 'frontend/src/pages/processes/hardening');

function collectQuestFiles(dir) {
    const files = [];
    for (const entry of fs.readdirSync(dir)) {
        const full = path.join(dir, entry);
        const stats = fs.statSync(full);
        if (stats.isDirectory()) {
            files.push(...collectQuestFiles(full));
        } else if (entry.endsWith('.json')) {
            files.push(full);
        }
    }
    return files;
}

function logErrors(label, filePath, errors) {
    console.error(`[${label}] ${filePath}`);
    for (const error of errors ?? []) {
        console.error('  ', error);
    }
}

function validateQuest(filePath) {
    const quest = readJson(filePath);
    const valid = validateQuestSchema(quest);
    const errors = [];
    if (!valid) {
        errors.push(...(validateQuestSchema.errors ?? []).map((err) => `${err.instancePath} ${err.message}`));
    }
    const hardeningIssues = validateHardening(quest.hardening);
    const baseline = evaluateQuestQuality(quest);
    if (quest.hardening?.score < baseline) {
        errors.push(`score ${quest.hardening?.score ?? 'missing'} below baseline ${baseline}`);
    }
    if (quest.hardening?.emoji !== computeEmoji(quest.hardening?.passes ?? 0, quest.hardening?.score ?? 0)) {
        errors.push('emoji does not match thresholds');
    }
    if (hardeningIssues.length) {
        errors.push(...hardeningIssues);
    }
    if (errors.length) {
        logErrors('quest', filePath, errors);
    }
    return errors.length === 0;
}

function validateProcesses() {
    const processes = readJson(processBasePath);
    const results = [];
    const processMap = new Map(processes.map((p) => [p.id, p]));
    for (const proc of processes) {
        const errors = [];
        if (!validateProcessSchema(proc)) {
            errors.push(...(validateProcessSchema.errors ?? []).map((err) => `${err.instancePath} ${err.message}`));
        }
        const hardeningIssues = validateHardening(proc.hardening);
        const baseline = evaluateProcessQuality(proc);
        if (proc.hardening?.score < baseline) {
            errors.push(`score ${proc.hardening?.score ?? 'missing'} below baseline ${baseline}`);
        }
        if (proc.hardening?.emoji !== computeEmoji(proc.hardening?.passes ?? 0, proc.hardening?.score ?? 0)) {
            errors.push('emoji does not match thresholds');
        }
        if (hardeningIssues.length) {
            errors.push(...hardeningIssues);
        }
        if (errors.length) {
            logErrors('process', `base:${proc.id}`, errors);
            results.push(false);
        } else {
            results.push(true);
        }
    }

    if (fs.existsSync(processHardeningDir)) {
        for (const entry of fs.readdirSync(processHardeningDir)) {
            if (!entry.endsWith('.json')) continue;
            const filePath = path.join(processHardeningDir, entry);
            const data = readJson(filePath);
            const errors = validateHardening(data);
            const baseline = processMap.has(entry.replace(/\.json$/, ''))
                ? evaluateProcessQuality(processMap.get(entry.replace(/\.json$/, '')))
                : 0;
            if (data?.score < baseline) {
                errors.push(`score ${data?.score ?? 'missing'} below baseline ${baseline}`);
            }
            if (data?.emoji !== computeEmoji(data?.passes ?? 0, data?.score ?? 0)) {
                errors.push('emoji does not match thresholds');
            }
            if (errors.length) {
                logErrors('process-hardening', filePath, errors);
                results.push(false);
            } else {
                results.push(true);
            }
        }
    }

    return results.every(Boolean);
}

function main() {
    const questFiles = collectQuestFiles(questDir);
    const questResults = questFiles.map(validateQuest);
    const processResults = validateProcesses();
    if (questResults.every(Boolean) && processResults) {
        console.log('Hardening validation passed for quests and processes.');
        return;
    }
    process.exitCode = 1;
}

main();
