import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const runLinkCheck = () =>
    execFileSync('node', ['scripts/link-check.mjs'], {
        encoding: 'utf8',
        stdio: 'pipe',
    });
const runLinkCheckInDir = (cwd: string) =>
    execFileSync('node', [path.join(process.cwd(), 'scripts/link-check.mjs')], {
        cwd,
        encoding: 'utf8',
        stdio: 'pipe',
    });

describe('markdown link validation', () => {
    it('resolves internal and GitHub links without 404s', () => {
        expect(() => runLinkCheck()).not.toThrow();
    });

    it('fails on stale dspace self-links that still target the v3 branch', () => {
        const fixtureDir = mkdtempSync(path.join(tmpdir(), 'link-check-stale-'));
        try {
            writeFileSync(
                path.join(fixtureDir, 'README.md'),
                [
                    '[blob](https://github.com/democratizedspace/dspace/blob/v3/README.md)',
                    '[tree](https://github.com/democratizedspace/dspace/tree/v3/docs)',
                    '[raw](https://raw.githubusercontent.com/democratizedspace/dspace/v3/README.md)',
                ].join('\n')
            );

            expect(() => runLinkCheckInDir(fixtureDir)).toThrow();
        } finally {
            rmSync(fixtureDir, { recursive: true, force: true });
        }
    });

    it('accepts main-branch self-links and non-branch v3 references', () => {
        const fixtureDir = mkdtempSync(path.join(tmpdir(), 'link-check-main-'));
        try {
            mkdirSync(path.join(fixtureDir, 'docs', 'qa'), { recursive: true });
            writeFileSync(path.join(fixtureDir, 'README.md'), '# fixture');
            writeFileSync(path.join(fixtureDir, 'docs', 'qa', 'v3.md'), '# v3 qa notes');
            writeFileSync(
                path.join(fixtureDir, 'links.md'),
                [
                    '[main](https://github.com/democratizedspace/dspace/blob/main/README.md)',
                    '[local-v3](docs/qa/v3.md)',
                    'Release note reference: v3.0.0-rc.4',
                ].join('\n')
            );

            expect(() => runLinkCheckInDir(fixtureDir)).not.toThrow();
        } finally {
            rmSync(fixtureDir, { recursive: true, force: true });
        }
    });
});
