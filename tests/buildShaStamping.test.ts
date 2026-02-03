import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

const readFile = (relativePath: string): string => {
    const fullPath = join(repoRoot, relativePath);
    if (!existsSync(fullPath)) {
        throw new Error(`File not found: ${fullPath}`);
    }
    return readFileSync(fullPath, 'utf8');
};

describe('build SHA stamping', () => {
    it('wires VITE_GIT_SHA into the build and runtime Dockerfile stages', () => {
        const dockerfile = readFile('Dockerfile');
        const buildStage = dockerfile
            .split('FROM deps AS build')[1]
            ?.split('FROM base AS prod-deps')[0];
        const runtimeStage = dockerfile.split('FROM node:20-bookworm-slim AS runtime')[1];

        expect(buildStage).toBeDefined();
        expect(buildStage).toMatch(/ENV\s+VITE_GIT_SHA/);

        expect(runtimeStage).toBeDefined();
        expect(runtimeStage).toMatch(/ENV\s+VITE_GIT_SHA/);
    });

    it('passes Git SHA build args in the container build workflows', () => {
        const workflows = [
            '.github/workflows/ci-image.yml',
            '.github/workflows/build.yml',
        ];

        workflows.forEach((workflowPath) => {
            const workflow = readFile(workflowPath);
            expect(workflow).toContain('GIT_SHA=${{ github.sha }}');
            expect(workflow).toContain('VITE_GIT_SHA=${{ github.sha }}');
        });
    });
});
