import { describe, expect, it } from 'vitest';
import { globSync } from 'glob';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

function getWorkflow(file: string): Record<string, unknown> {
    const path = join(repoRoot, '.github', 'workflows', file);
    const content = readFileSync(path, 'utf8');
    return parse(content) as Record<string, unknown>;
}

function hasEvent(workflow: Record<string, unknown>, eventName: string): boolean {
    const on = workflow.on;
    if (typeof on === 'string') {
        return on === eventName;
    }
    if (Array.isArray(on)) {
        return on.includes(eventName);
    }
    if (on && typeof on === 'object') {
        return Object.prototype.hasOwnProperty.call(on, eventName);
    }
    return false;
}

describe('workflow integrity guardrails', () => {
    it('parses every workflow file and includes jobs', () => {
        const paths = globSync('.github/workflows/*.yml', { cwd: repoRoot });
        expect(paths.length).toBeGreaterThan(0);

        for (const relativePath of paths) {
            const content = readFileSync(join(repoRoot, relativePath), 'utf8');
            const workflow = parse(content) as Record<string, unknown>;
            expect(workflow.name, `${relativePath} is missing a workflow name`).toBeTypeOf('string');
            expect(workflow.jobs, `${relativePath} is missing jobs`).toBeTruthy();
        }
    });


    it('keeps core CI workflows wired to pull_request events', () => {
        const requiredOnPullRequest = [
            'build.yml',
            'ci.yml',
            'tests.yml',
            'ci-image.yml',
            'link-check.yml',
        ];

        for (const file of requiredOnPullRequest) {
            const workflow = getWorkflow(file);
            expect(hasEvent(workflow, 'pull_request'), `${file} must run on pull_request`).toBe(true);
        }
    });

    it('keeps the build workflow active for pull requests to both long-lived branches', () => {
        const workflow = getWorkflow('build.yml');
        expect(hasEvent(workflow, 'pull_request')).toBe(true);

        const pullRequest = (workflow.on as Record<string, unknown>).pull_request as
            | Record<string, unknown>
            | undefined;
        expect(pullRequest).toBeTruthy();

        const branches = (pullRequest?.branches as string[] | undefined) ?? [];
        expect(branches).toEqual(expect.arrayContaining(['main', 'v3']));
    });

    it('runs an aggregate workflow-integrity gate on PRs', () => {
        const workflow = getWorkflow('workflow-integrity.yml');
        expect(hasEvent(workflow, 'pull_request')).toBe(true);

        const jobs = workflow.jobs as Record<string, unknown>;
        expect(Object.keys(jobs)).toContain('guard');
    });
});
