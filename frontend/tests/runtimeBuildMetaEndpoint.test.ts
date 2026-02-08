import { describe, it, expect, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildRuntimeBuildMetaResponse } from '../src/utils/runtimeEndpoints';

describe('runtime build metadata endpoint', () => {
    const envBackup = { ...process.env };
    let tempDir = '';

    afterEach(async () => {
        process.env = { ...envBackup };
        if (tempDir) {
            await rm(tempDir, { recursive: true, force: true });
            tempDir = '';
        }
    });

    it('returns build metadata from the runtime path', async () => {
        tempDir = await mkdtemp(path.join(os.tmpdir(), 'dspace-build-meta-'));
        const metaPath = path.join(tempDir, 'build_meta.json');
        await writeFile(
            metaPath,
            JSON.stringify(
                {
                    gitSha: 'abc123def456',
                    generatedAt: '2026-02-07T01:02:03.000Z',
                    source: 'ci',
                },
                null,
                2
            ),
            'utf8'
        );
        process.env.DSPACE_BUILD_META_PATH = metaPath;

        const response = await buildRuntimeBuildMetaResponse();
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.gitSha).toBe('abc123def456');
        expect(body.source).toBe('ci');
    });
});
