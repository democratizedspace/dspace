import { describe, expect, it } from 'vitest';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

const chartPath = join(repoRoot, 'charts', 'dspace', 'Chart.yaml');
const valuesPath = join(repoRoot, 'charts', 'dspace', 'values.yaml');
const versionPath = join(repoRoot, 'docs', 'apps', 'dspace.version');
const packageLockPath = join(repoRoot, 'package-lock.json');
const packageJson = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));
const frontendPackageJson = JSON.parse(readFileSync(join(repoRoot, 'frontend', 'package.json'), 'utf8'));
const packageLockJson = JSON.parse(readFileSync(packageLockPath, 'utf8'));

const copyCoordinateFixture = () => {
    const fixtureRoot = mkdtempSync(join(tmpdir(), 'dspace-version-'));
    for (const path of ['package.json', 'package-lock.json', 'frontend/package.json']) {
        mkdirSync(dirname(join(fixtureRoot, path)), { recursive: true });
        cpSync(join(repoRoot, path), join(fixtureRoot, path), { recursive: true });
    }
    for (const path of ['charts/dspace/Chart.yaml', 'charts/dspace/values.yaml', 'docs/apps/dspace.version']) {
        mkdirSync(dirname(join(fixtureRoot, path)), { recursive: true });
        cpSync(join(repoRoot, path), join(fixtureRoot, path), { recursive: true });
    }
    return fixtureRoot;
};

const runGuard = (fixtureRoot: string) =>
    spawnSync('bash', [join(repoRoot, 'scripts', 'check-dspace-chart-version.sh')], {
        cwd: repoRoot,
        env: { ...process.env, DSPACE_VERSION_ROOT: fixtureRoot },
        encoding: 'utf8',
    });

describe('DSPACE release coordinates', () => {
    const chartContent = readFileSync(chartPath, 'utf8');
    const valuesContent = readFileSync(valuesPath, 'utf8');
    const versionContent = readFileSync(versionPath, 'utf8');

    const chartVersionMatch = chartContent.match(/^version:\s*"?([^"\n]+)"?/m);
    const appVersionMatch = chartContent.match(/^appVersion:\s*"?([^"\n]+)"?/m);
    const imageTagMatch = valuesContent.match(/^\s*tag:\s*([^\n]+)/m);

    it('sets every authoritative coordinate to the 3.1.0 release candidate metadata', () => {
        expect(packageJson.version).toBe('3.1.0');
        expect(frontendPackageJson.version).toBe('3.1.0');
        expect(packageLockJson.version).toBe('3.1.0');
        expect(packageLockJson.packages[''].version).toBe('3.1.0');
        expect(chartVersionMatch?.[1]).toBe('3.1.0');
        expect(appVersionMatch?.[1]).toBe('3.1.0');
        expect(imageTagMatch?.[1].trim()).toBe('v3.1.0');
        expect(versionContent).toMatch(/^3\.1\.0$/m);
    });

    it('keeps appVersion unprefixed while image.tag uses the human-readable v-prefixed tag', () => {
        expect(appVersionMatch?.[1]).toBe(packageJson.version);
        expect(appVersionMatch?.[1].startsWith('v')).toBe(false);
        expect(imageTagMatch?.[1].trim()).toBe(`v${packageJson.version}`);
    });

    it('passes the release-coordinate guard for the repository fixture', () => {
        const fixtureRoot = copyCoordinateFixture();
        try {
            const result = runGuard(fixtureRoot);
            expect(result.status, result.stderr).toBe(0);
            expect(result.stdout).toContain('DSPACE release coordinates are aligned at 3.1.0');
        } finally {
            rmSync(fixtureRoot, { recursive: true, force: true });
        }
    });

    it('rejects representative coordinate mismatches without scanning historical docs', () => {
        const fixtureRoot = copyCoordinateFixture();
        try {
            writeFileSync(join(fixtureRoot, 'docs', 'apps', 'dspace.version'), '3.0.1\n');
            const result = runGuard(fixtureRoot);
            expect(result.status).not.toBe(0);
            expect(result.stderr).toContain("docs/apps/dspace.version mismatch: found '3.0.1'");
        } finally {
            rmSync(fixtureRoot, { recursive: true, force: true });
        }
    });


    it('reports labeled failures when JSON coordinates are missing', () => {
        const fixtureRoot = copyCoordinateFixture();
        try {
            const packageLock = JSON.parse(readFileSync(join(fixtureRoot, 'package-lock.json'), 'utf8'));
            delete packageLock.packages[''].version;
            writeFileSync(
                join(fixtureRoot, 'package-lock.json'),
                `${JSON.stringify(packageLock, null, 2)}\n`
            );

            const result = runGuard(fixtureRoot);
            expect(result.status).not.toBe(0);
            expect(result.stderr).toContain(
                `Missing package-lock packages[""].version; expected '3.1.0'`
            );
            expect(result.stderr).toContain('DSPACE release coordinates are not aligned.');
        } finally {
            rmSync(fixtureRoot, { recursive: true, force: true });
        }
    });

    it('reports labeled failures when docs/apps/dspace.version has no strict semver line', () => {
        const fixtureRoot = copyCoordinateFixture();
        try {
            writeFileSync(join(fixtureRoot, 'docs', 'apps', 'dspace.version'), '3.1.0   \n');

            const result = runGuard(fixtureRoot);
            expect(result.status).not.toBe(0);
            expect(result.stderr).toContain("Missing docs/apps/dspace.version; expected '3.1.0'");
            expect(result.stderr).toContain('DSPACE release coordinates are not aligned.');
        } finally {
            rmSync(fixtureRoot, { recursive: true, force: true });
        }
    });

    it('continues to ignore historical v3.0.1 documentation outside authoritative coordinates', () => {
        const stdout = execFileSync('bash', ['scripts/check-dspace-chart-version.sh'], {
            cwd: repoRoot,
            encoding: 'utf8',
        });
        expect(stdout).toContain('DSPACE release coordinates are aligned at 3.1.0');
        expect(readFileSync(join(repoRoot, 'docs', 'qa', 'v3.0.1.md'), 'utf8')).toContain('v3.0.1');
    });
});
