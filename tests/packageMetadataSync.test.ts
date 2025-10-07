import { describe, expect, it } from 'vitest';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { syncPackageMetadata } from '../frontend/scripts/sync-package.js';

describe('sync-package metadata script', () => {
  const writeJson = (filePath: string, data: Record<string, unknown>) => {
    writeFileSync(filePath, `${JSON.stringify(data, null, 4)}\n`, 'utf8');
  };

  const setupWorkspace = (
    rootData: Record<string, unknown>,
    frontendData: Record<string, unknown>
  ) => {
    const workspace = mkdtempSync(path.join(os.tmpdir(), 'pkg-sync-'));
    const rootPackagePath = path.join(workspace, 'package.json');
    const frontendDir = path.join(workspace, 'frontend');
    mkdirSync(frontendDir);
    const targetPackagePath = path.join(frontendDir, 'package.json');

    writeJson(rootPackagePath, rootData);
    writeJson(targetPackagePath, frontendData);

    const cleanup = () => rmSync(workspace, { recursive: true, force: true });

    return { workspace, rootPackagePath, targetPackagePath, cleanup };
  };

  it('syncs basic package metadata fields from the root manifest', () => {
    const { rootPackagePath, targetPackagePath, cleanup } = setupWorkspace(
      {
        name: 'dspace',
        version: '3.1.0',
        description: 'Root description',
        license: 'Apache-2.0',
      },
      {
        name: 'dspace-frontend',
        version: '3.0.0',
        description: 'Out-of-date description',
        license: 'MIT',
      }
    );

    try {
      const updates = syncPackageMetadata({
        rootPackagePath,
        targetPackagePath,
        logger: { log: () => {} },
      });

      const updated = JSON.parse(
        readFileSync(targetPackagePath, 'utf8')
      ) as Record<string, string>;

      expect(updates).toEqual(['name', 'version', 'description', 'license']);
      expect(updated).toMatchObject({
        name: 'dspace',
        version: '3.1.0',
        description: 'Root description',
        license: 'Apache-2.0',
      });
    } finally {
      cleanup();
    }
  });

  it('does not rewrite the frontend manifest when metadata already matches', () => {
    const manifest = {
      name: 'dspace',
      version: '3.1.0',
      description: 'Root description',
      license: 'Apache-2.0',
    };

    const { rootPackagePath, targetPackagePath, cleanup } = setupWorkspace(
      manifest,
      manifest
    );

    try {
      const updates = syncPackageMetadata({
        rootPackagePath,
        targetPackagePath,
        logger: { log: () => {} },
      });

      expect(updates).toEqual([]);
      const finalContents = readFileSync(targetPackagePath, 'utf8');
      expect(finalContents).toBe(`${JSON.stringify(manifest, null, 4)}\n`);
    } finally {
      cleanup();
    }
  });
});
