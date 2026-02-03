import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const readFile = (relativePath: string) =>
    fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf-8');

describe('build SHA injection', () => {
    it('wires the build arg into the Dockerfile build stage', () => {
        const dockerfile = readFile('Dockerfile');

        expect(dockerfile).toContain('ARG GIT_SHA=unknown');
        expect(dockerfile).toMatch(/ARG VITE_GIT_SHA=\$\{GIT_SHA\}/);
        expect(dockerfile).toMatch(/ENV VITE_GIT_SHA="\$\{VITE_GIT_SHA\}"/);
    });

    it('passes GIT_SHA and VITE_GIT_SHA in CI image workflows', () => {
        const ciImage = readFile('.github/workflows/ci-image.yml');
        expect(ciImage).toContain('GIT_SHA=${{ github.sha }}');
        expect(ciImage).toContain('VITE_GIT_SHA=${{ github.sha }}');

        const buildWorkflow = readFile('.github/workflows/build.yml');
        expect(buildWorkflow).toContain('GIT_SHA=${{ github.sha }}');
        expect(buildWorkflow).toContain('VITE_GIT_SHA=${{ github.sha }}');
    });
});
