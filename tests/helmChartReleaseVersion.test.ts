import { describe, expect, it } from 'vitest';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

const chartPath = join(repoRoot, 'charts', 'dspace', 'Chart.yaml');
const valuesPath = join(repoRoot, 'charts', 'dspace', 'values.yaml');
const versionFilePath = join(repoRoot, 'docs', 'apps', 'dspace.version');
const packageJsonPath = join(repoRoot, 'package.json');
const frontendPackageJsonPath = join(repoRoot, 'frontend', 'package.json');
const packageLockPath = join(repoRoot, 'package-lock.json');
const versionGuardPath = join(repoRoot, 'scripts', 'check-dspace-chart-version.sh');

const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const frontendPackageJson = JSON.parse(readFileSync(frontendPackageJsonPath, 'utf8'));
const packageLock = JSON.parse(readFileSync(packageLockPath, 'utf8'));

function makeGuardFixture(): string {
    const fixtureRoot = mkdtempSync(join(tmpdir(), 'dspace-version-guard-'));
    for (const directory of ['charts/dspace', 'docs/apps', 'frontend', 'scripts']) {
        cpSync(join(repoRoot, directory), join(fixtureRoot, directory), { recursive: true });
    }
    for (const file of ['package.json', 'package-lock.json']) {
        cpSync(join(repoRoot, file), join(fixtureRoot, file));
    }
    return fixtureRoot;
}

function runGuard(fixtureRoot: string): string {
    return execFileSync('bash', [versionGuardPath], {
        cwd: repoRoot,
        env: { ...process.env, DSPACE_VERSION_ROOT: fixtureRoot },
        encoding: 'utf8',
    });
}

describe('DSPACE release coordinates', () => {
    const chartContent = readFileSync(chartPath, 'utf8');
    const valuesContent = readFileSync(valuesPath, 'utf8');
    const versionFileContent = readFileSync(versionFilePath, 'utf8');

    const chartVersionMatch = chartContent.match(/^version:\s*"?([^"\n]+)"?/m);
    const appVersionMatch = chartContent.match(/^appVersion:\s*"?([^"\n]+)"?/m);
    const imageTagMatch = valuesContent.match(/^\s*tag:\s*([^\n]+)/m);
    const versionFileMatch = versionFileContent.match(/^([0-9]+\.[0-9]+\.[0-9]+)$/m);

    it('aligns all authoritative coordinates on 3.1.0', () => {
        expect(packageJson.version).toBe('3.1.0');
        expect(frontendPackageJson.version).toBe('3.1.0');
        expect(packageLock.version).toBe('3.1.0');
        expect(packageLock.packages[''].version).toBe('3.1.0');
        expect(chartVersionMatch?.[1]).toBe('3.1.0');
        expect(versionFileMatch?.[1]).toBe('3.1.0');
    });

    it('keeps chart appVersion unprefixed and default image tag v-prefixed', () => {
        expect(appVersionMatch?.[1], 'appVersion should not include a leading v').toBe('3.1.0');
        expect(imageTagMatch?.[1].trim(), 'image.tag should be v-prefixed').toBe('v3.1.0');
    });

    it('accepts historical v3.0.1 documentation outside active coordinate files', () => {
        const historicalQa = readFileSync(join(repoRoot, 'docs', 'qa', 'v3.0.1.md'), 'utf8');
        expect(historicalQa).toContain('v3.0.1');
        expect(() => runGuard(repoRoot)).not.toThrow();
    });

    it('rejects representative coordinate mismatches', () => {
        const fixtureRoot = makeGuardFixture();
        try {
            const valuesFile = join(fixtureRoot, 'charts', 'dspace', 'values.yaml');
            writeFileSync(
                valuesFile,
                readFileSync(valuesFile, 'utf8').replace('tag: v3.1.0', 'tag: v3.0.1')
            );

            expect(() => runGuard(fixtureRoot)).toThrow(/chart default image\.tag mismatch/);
        } finally {
            rmSync(fixtureRoot, { recursive: true, force: true });
        }
    });
});
