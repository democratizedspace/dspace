import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const runLinkCheck = () =>
    execFileSync('node', ['scripts/link-check.mjs'], {
        encoding: 'utf8',
        stdio: 'pipe',
    });

describe('markdown link validation', () => {
    it('resolves internal and GitHub links without 404s', () => {
        expect(() => runLinkCheck()).not.toThrow();
    });
});
