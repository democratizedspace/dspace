import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { resolveRuntimeBuildMeta } from '../frontend/src/utils/runtimeBuildMeta';

describe('resolveRuntimeBuildMeta', () => {
    it('resolves build metadata from a runtime file path', async () => {
        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dspace-build-meta-'));
        const metaPath = path.join(tempDir, 'build_meta.json');
        const payload = {
            gitSha: 'abc123def456',
            generatedAt: '2026-02-07T12:00:00.000Z',
            source: 'ci',
        };

        await fs.writeFile(metaPath, JSON.stringify(payload), 'utf8');

        const resolved = await resolveRuntimeBuildMeta({
            paths: [metaPath],
            env: {},
        });

        expect(resolved?.gitSha).toBe(payload.gitSha);
        expect(resolved?.source).toBe(payload.source);
        expect(resolved?.origin).toBe('runtime-file');
    });
});
