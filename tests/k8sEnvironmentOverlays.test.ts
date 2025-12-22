import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const overlayDocPath = join(repoRoot, 'docs', 'ops', 'deploy', 'k8s-environments.md');
const overlayRoot = join(repoRoot, 'infra', 'k8s', 'environments');
const productionOverlayPath = join(overlayRoot, 'production', 'kustomization.yaml');
const productionPatchPath = join(overlayRoot, 'production', 'patch-deployment.yaml');

describe('kubernetes environment overlays', () => {
    it('documents the production overlay entrypoint', () => {
        expect(existsSync(overlayDocPath)).toBe(true);

        const content = readFileSync(overlayDocPath, 'utf8');
        expect(content).toMatch(/infra\/k8s\/environments\/production/);
        expect(content).toMatch(/kustomization\.yaml/);
        expect(content).toMatch(/k3s-sugarkube-dev\.md/);
        expect(content).toMatch(/sugarkube/);
    });

    it('ships a production overlay wired to the base manifests', () => {
        expect(existsSync(productionOverlayPath)).toBe(true);
        expect(existsSync(productionPatchPath)).toBe(true);

        const kustomization = readFileSync(productionOverlayPath, 'utf8');
        expect(kustomization).toContain('../..');
        expect(kustomization).toMatch(/patch-deployment\.yaml/);

        const patch = readFileSync(productionPatchPath, 'utf8');
        expect(patch).toMatch(/replicas:\s*2/);
    });
});
