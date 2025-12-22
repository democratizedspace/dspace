import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const overlayDocPath = join(repoRoot, 'docs', 'ops', 'deploy', 'k8s-environments.md');
const overlayRoot = join(repoRoot, 'infra', 'k8s', 'environments');
const productionOverlayPath = join(overlayRoot, 'production', 'kustomization.yaml');
const k8sReadmePath = join(repoRoot, 'infra', 'k8s', 'README.md');

describe('kubernetes environment overlays', () => {
    it('documents the production overlay entrypoint', () => {
        expect(existsSync(overlayDocPath)).toBe(true);

        const content = readFileSync(overlayDocPath, 'utf8');
        expect(content).toMatch(/infra\/k8s\/environments\/production/);
        expect(content).toMatch(/kustomization\.yaml/);
    });

    it('links the overlays back to the sugarkube k3s runbook', () => {
        expect(existsSync(overlayDocPath)).toBe(true);
        expect(existsSync(k8sReadmePath)).toBe(true);

        const overlayDoc = readFileSync(overlayDocPath, 'utf8');
        const k8sReadme = readFileSync(k8sReadmePath, 'utf8');

        expect(overlayDoc).toMatch(/k3s-sugarkube-dev\.md/);
        expect(k8sReadme).toMatch(/k3s-sugarkube-dev\.md/);
    });

    it('ships a production overlay wired to the base manifests', () => {
        expect(existsSync(productionOverlayPath)).toBe(true);

        const kustomization = readFileSync(productionOverlayPath, 'utf8');
        expect(kustomization).toContain('../../k8s');
        expect(kustomization).toMatch(/patch-deployment\.yaml/);
    });
});
