import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { collectPromptMetrics } from '../frontend/src/utils/promptMetrics.js';

const payload = {
    combinedMessages: [
        { role: 'system', content: 'system only' },
        { role: 'user', content: 'hello 🌙' },
    ],
};

describe('prompt metrics', () => {
    it('returns sizes without prompt content', () => {
        const metrics = collectPromptMetrics(payload, {
            componentByMessageIndex: { 0: 'systemInstructions', 1: 'latestUserMessage' },
        });
        expect(JSON.stringify(metrics)).not.toContain('system only');
        expect(JSON.stringify(metrics)).not.toContain('hello');
        expect(metrics.messageCount).toBe(2);
        expect(metrics.roleCounts).toEqual({ system: 1, user: 1 });
    });

    it('counts UTF-8 bytes correctly', () => {
        const metrics = collectPromptMetrics(payload);
        expect(metrics.messages[1].characters).toBe(8);
        expect(metrics.messages[1].utf8Bytes).toBe(10);
        expect(metrics.totalUtf8Bytes).toBe(21);
    });

    it('accounts for components deterministically', () => {
        const first = collectPromptMetrics(payload, {
            componentByMessageIndex: { 0: 'systemInstructions', 1: 'latestUserMessage' },
            promptBuildMs: 12,
            ragMs: 3,
        });
        const second = collectPromptMetrics(payload, {
            componentByMessageIndex: { 0: 'systemInstructions', 1: 'latestUserMessage' },
            promptBuildMs: 12,
            ragMs: 3,
        });
        expect(first).toEqual(second);
        expect(first.componentTotals.systemInstructions.characters).toBe(11);
        expect(first.componentTotals.latestUserMessage.utf8Bytes).toBe(10);
    });

    it('benchmark fixtures avoid obvious secrets and real user data', () => {
        const script = readFileSync('scripts/benchmark-token-place-context.mjs', 'utf8');
        expect(script).not.toMatch(/sk-[A-Za-z0-9]/);
        expect(script).not.toMatch(/BEGIN (?:RSA |OPENSSH |)PRIVATE KEY/);
        expect(script).toContain('synthetic');
    });
});
