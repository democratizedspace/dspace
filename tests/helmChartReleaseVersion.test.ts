import { describe, expect, it } from 'vitest';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const coordinatePaths = [
    'package.json',
    'frontend/package.json',
    'package-lock.json',
    'charts/dspace/Chart.yaml',
    'charts/dspace/values.yaml',
    'docs/apps/dspace.version',
];

const fixture = () => {
    const root = mkdtempSync(join(tmpdir(), 'dspace-version-'));
    for (const path of coordinatePaths) {
        mkdirSync(dirname(join(root, path)), { recursive: true });
        cpSync(join(repoRoot, path), join(root, path));
    }
    return root;
};

const runGuard = (root: string) =>
    spawnSync('bash', [join(repoRoot, 'scripts/check-dspace-chart-version.sh')], {
        env: { ...process.env, DSPACE_VERSION_ROOT: root },
        encoding: 'utf8',
    });

const replace = (root: string, path: string, search: string | RegExp, value: string) => {
    const file = join(root, path);
    const current = readFileSync(file, 'utf8');
    const next = current.replace(search, value);
    expect(next).not.toBe(current);
    writeFileSync(file, next);
};

const withFixture = (check: (root: string) => void) => {
    const root = fixture();
    try {
        check(root);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
};

describe('independent DSPACE application and chart coordinates', () => {
    it('passes current repository coordinates and reports both groups', () =>
        withFixture((root) => {
            const result = runGuard(root);
            expect(result.status, result.stderr).toBe(0);
            expect(result.stdout).toContain('application version 3.1.0 (v3.1.0)');
            expect(result.stdout).toContain('chart version 3.1.0');
        }));

    it('permits chart 3.0.2 with application 3.0.1', () =>
        withFixture((root) => {
            for (const path of ['package.json', 'frontend/package.json', 'package-lock.json']) {
                replace(root, path, /"version": "3\.1\.0"/g, '"version": "3.0.1"');
            }
            replace(root, 'charts/dspace/Chart.yaml', /^version: 3\.1\.0$/m, 'version: 3.0.2');
            replace(root, 'charts/dspace/Chart.yaml', 'appVersion: "3.1.0"', 'appVersion: "3.0.1"');
            replace(root, 'charts/dspace/values.yaml', /^\s*tag: v3\.1\.0$/m, '  tag: v3.0.1');
            writeFileSync(join(root, 'docs/apps/dspace.version'), '3.0.2\n');
            const result = runGuard(root);
            expect(result.status, result.stderr).toBe(0);
            expect(result.stdout).toContain('application version 3.0.1');
            expect(result.stdout).toContain('chart version 3.0.2');
        }));

    it.each([
        ['root package version', 'package.json', /"version": "3\.1\.0"/, '"version": "3.0.9"'],
        ['frontend package version', 'frontend/package.json', /"version": "3\.1\.0"/, '"version": "3.0.9"'],
        ['package-lock top-level version', 'package-lock.json', /"version": "3\.1\.0"/, '"version": "3.0.9"'],
        ['package-lock packages[""].version', 'package-lock.json', /("": \{\n(?:\s*"name"[^\n]*\n)?\s*)"version": "3\.1\.0"/, '$1"version": "3.0.9"'],
        ['chart appVersion', 'charts/dspace/Chart.yaml', 'appVersion: "3.1.0"', 'appVersion: "3.0.9"'],
        ['chart default image.tag', 'charts/dspace/values.yaml', 'tag: v3.1.0', 'tag: v3.0.9'],
    ])('rejects application drift in %s', (label, path, search, value) =>
        withFixture((root) => {
            replace(root, path, search, value);
            const result = runGuard(root);
            expect(result.status).not.toBe(0);
            expect(result.stderr).toContain('Application coordinate drift:');
            expect(result.stderr).toContain(label === 'root package version' ? 'frontend package version' : label);
        }));

    it('rejects chart coordinate drift', () =>
        withFixture((root) => {
            writeFileSync(join(root, 'docs/apps/dspace.version'), '3.0.2\n');
            const result = runGuard(root);
            expect(result.status).not.toBe(0);
            expect(result.stderr).toContain('Chart coordinate drift: docs/apps/dspace.version');
        }));

    it('rejects a v-prefixed appVersion as non-SemVer application metadata', () =>
        withFixture((root) => {
            replace(root, 'charts/dspace/Chart.yaml', 'appVersion: "3.1.0"', 'appVersion: "v3.1.0"');
            const result = runGuard(root);
            expect(result.status).not.toBe(0);
            expect(result.stderr).toContain("chart appVersion must be a semantic version");
            expect(result.stderr).toContain('Application coordinate drift: chart appVersion');
        }));

    it('uses Chart.yaml version for an exact clean package filename and OCI reference', () => {
        const workflow = readFileSync(join(repoRoot, '.github/workflows/ci-helm.yml'), 'utf8');
        expect(workflow).toContain('expected_chart_file="$chart_dist/dspace-${chart_version}.tgz"');
        expect(workflow).toContain('find "$chart_dist" -maxdepth 1');
        expect(workflow).toContain('packaged_version=$(helm show chart');
        expect(workflow).toContain('packaged_app_version=$(helm show chart');
        expect(workflow).toContain('${{ steps.package.outputs.chart_version }}');
        expect(workflow).not.toMatch(/package\.json[\s\S]*chart_ref=/);
    });

    it('does not scan historical release records as authoritative coordinates', () =>
        withFixture((root) => {
            mkdirSync(join(root, 'docs/qa'), { recursive: true });
            writeFileSync(join(root, 'docs/qa/v3.0.1.md'), 'historical version v999.999.999\n');
            expect(runGuard(root).status).toBe(0);
        }));
});
