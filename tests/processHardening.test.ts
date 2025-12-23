import { describe, it, expect } from 'vitest';
import Ajv from 'ajv';
import processes from '../frontend/src/generated/processes.json' assert { type: 'json' };
import processSchema from '../frontend/src/pages/processes/jsonSchemas/process.json' assert { type: 'json' };
import hardeningSchema from '../frontend/src/pages/shared/hardening.schema.json' assert { type: 'json' };
import {
    computeEmoji,
    evaluateProcessQuality,
    validateHardening,
} from '../scripts/hardening/utils.mjs';

describe('process hardening metadata', () => {
    const ajv = new Ajv({ allErrors: true });
    ajv.addSchema(hardeningSchema as any);
    const validateProcess = ajv.compile(processSchema as any);

    it('validates schema, structure, and quality scores', () => {
        const castProcesses = processes as Array<any>;
        expect(castProcesses.length).toBeGreaterThan(0);
        for (const proc of castProcesses) {
            const valid = validateProcess(proc);
            if (!valid) {
                console.error(validateProcess.errors);
            }
            expect(valid).toBe(true);
            const issues = validateHardening(proc.hardening);
            expect(issues).toEqual([]);
            const baseline = evaluateProcessQuality(proc);
            expect(proc.hardening.score).toBeGreaterThanOrEqual(baseline);
            expect(proc.hardening.emoji).toBe(
                computeEmoji(proc.hardening.passes, proc.hardening.score)
            );
        }
    });
});
