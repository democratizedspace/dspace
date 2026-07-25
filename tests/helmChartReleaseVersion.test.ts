import { describe, expect, it } from 'vitest';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const guard = join(repoRoot, 'scripts/check-dspace-chart-version.sh');
const coordinateFiles = [
    'package.json',
    'frontend/package.json',
    'package-lock.json',
    'charts/dspace/Chart.yaml',
    'charts/dspace/values.yaml',
    'docs/apps/dspace.version',
];

const fixture = () => {
    const root = mkdtempSync(join(tmpdir(), 'dspace-version-'));
    for (const file of coordinateFiles) {
        mkdirSync(dirname(join(root, file)), { recursive: true });
        cpSync(join(repoRoot, file), join(root, file));
    }
    return root;
};

const run = (root: string) =>
    spawnSync('bash', [guard], {
        cwd: repoRoot,
        env: { ...process.env, DSPACE_VERSION_ROOT: root },
        encoding: 'utf8',
    });

const replace = (root: string, file: string, search: string | RegExp, value: string) => {
    const path = join(root, file);
    const before = readFileSync(path, 'utf8');
    const after = before.replace(search, value);
    expect(after).not.toBe(before);
    writeFileSync(path, after);
};

const withFixture = (check: (root: string) => void) => {
    const root = fixture();
    try {
        check(root);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
};

describe('independent DSPACE release coordinate groups', () => {
    it('passes the current repository coordinates and reports both groups', () =>
        withFixture((root) => {
            const result = run(root);
            expect(result.status, result.stderr).toBe(0);
            expect(result.stdout).toContain('application version 3.1.0 (v3.1.0)');
            expect(result.stdout).toContain('chart version 3.1.0');
        }));

    it('allows chart 3.0.2 with application and appVersion 3.0.1', () =>
        withFixture((root) => {
            for (const file of ['package.json', 'frontend/package.json', 'package-lock.json']) {
                replace(root, file, /"version": "3\.1\.0"/g, '"version": "3.0.1"');
            }
            replace(root, 'charts/dspace/Chart.yaml', 'version: 3.1.0', 'version: 3.0.2');
            replace(root, 'charts/dspace/Chart.yaml', 'appVersion: "3.1.0"', 'appVersion: "3.0.1"');
            replace(root, 'charts/dspace/values.yaml', /tag: v3\.1\.0/, 'tag: v3.0.1');
            writeFileSync(join(root, 'docs/apps/dspace.version'), '3.0.2\n');
            const result = run(root);
            expect(result.status, result.stderr).toBe(0);
            expect(result.stdout).toContain('application version 3.0.1');
            expect(result.stdout).toContain('chart version 3.0.2');
        }));

    it.each([
        ['package.json', /"version": "3\.1\.0"/, '"version": "3.0.9"', 'frontend package version'],
        [
            'frontend/package.json',
            /"version": "3\.1\.0"/,
            '"version": "3.0.9"',
            'frontend package version',
        ],
        [
            'package-lock.json',
            /^  "version": "3\.1\.0",/m,
            '  "version": "3.0.9",',
            'package-lock top-level version',
        ],
        [
            'package-lock.json',
            /^      "version": "3\.1\.0",/m,
            '      "version": "3.0.9",',
            'package-lock packages[""].version',
        ],
        [
            'charts/dspace/Chart.yaml',
            'appVersion: "3.1.0"',
            'appVersion: "3.0.9"',
            'chart appVersion',
        ],
        ['charts/dspace/values.yaml', /tag: v3\.1\.0/, 'tag: v3.0.9', 'chart default image.tag'],
    ])('rejects application drift in %s', (file, search, value, label) =>
        withFixture((root) => {
            replace(root, file, search, value);
            const result = run(root);
            expect(result.status).not.toBe(0);
            expect(result.stderr).toContain(`application coordinate '${label}' drift`);
        })
    );

    it('rejects root application versions that are not bare SemVer', () =>
        withFixture((root) => {
            replace(root, 'package.json', '"version": "3.1.0"', '"version": "v3.1.0"');
            const result = run(root);
            expect(result.status).not.toBe(0);
            expect(result.stderr).toContain(
                "application coordinate 'root package version' must be a bare semantic version"
            );
        }));

    it('rejects chart documentation drift as chart-coordinate drift', () =>
        withFixture((root) => {
            writeFileSync(join(root, 'docs/apps/dspace.version'), '3.0.2\n');
            const result = run(root);
            expect(result.status).not.toBe(0);
            expect(result.stderr).toContain("chart coordinate 'docs/apps/dspace.version' drift");
        }));

    it('rejects a v-prefixed appVersion as an application coordinate', () =>
        withFixture((root) => {
            replace(
                root,
                'charts/dspace/Chart.yaml',
                'appVersion: "3.1.0"',
                'appVersion: "v3.1.0"'
            );
            const result = run(root);
            expect(result.status).not.toBe(0);
            expect(result.stderr).toContain(
                "application coordinate 'chart appVersion' must be a bare semantic version"
            );
        }));

    it('derives and verifies the package filename from the independent chart version', () => {
        const workflow = readFileSync(join(repoRoot, '.github/workflows/ci-helm.yml'), 'utf8');
        expect(workflow).toContain('expected_chart_file="$chart_dist/dspace-${chart_version}.tgz"');
        expect(workflow).toContain('helm package charts/dspace --destination "$chart_dist"');
        expect(workflow).toContain('helm show chart "$expected_chart_file"');
        expect(workflow).not.toMatch(/package\.json/);
    });

    it('does not scan historical release records as authoritative coordinates', () =>
        withFixture((root) => {
            mkdirSync(join(root, 'docs/qa'), { recursive: true });
            writeFileSync(join(root, 'docs/qa/v3.0.1.md'), 'historical version v999.999.999\n');
            const result = run(root);
            expect(result.status, result.stderr).toBe(0);
        }));
});
