import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';

const createTempDir = () =>
  fs.mkdtempSync(path.join(os.tmpdir(), 'ensure-astro-build-quest-flag-'));

const createBuiltArtifacts = (root: string) => {
  fs.mkdirSync(path.join(root, 'dist', 'server'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'dist', 'server', 'entry.mjs'),
    'export default {};'
  );
  fs.mkdirSync(path.join(root, 'dist', 'client', '_astro'), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(root, 'dist', 'client', '_astro', 'asset.js'),
    'console.log("ok");'
  );
};

const loadEnsureAstroBuild = async (
  questGraphDebug: 'true' | 'false' | undefined,
  dspaceEnv?: string
) => {
  vi.resetModules();

  if (questGraphDebug === undefined) {
    delete process.env.PUBLIC_ENABLE_QUEST_GRAPH_DEBUG;
  } else {
    process.env.PUBLIC_ENABLE_QUEST_GRAPH_DEBUG = questGraphDebug;
  }

  if (dspaceEnv === undefined) {
    delete process.env.DSPACE_ENV;
  } else {
    process.env.DSPACE_ENV = dspaceEnv;
  }

  return await import('../frontend/scripts/ensure-astro-build.mjs');
};

describe('ensureAstroBuild quest graph debug marker matching', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    delete process.env.PUBLIC_ENABLE_QUEST_GRAPH_DEBUG;
    delete process.env.DSPACE_ENV;
  });

  it('skips rebuild when existing artifacts marker matches env flag', async () => {
    const root = createTempDir();
    try {
      createBuiltArtifacts(root);
      fs.writeFileSync(
        path.join(root, 'dist', '.quest-graph-debug-flag'),
        'false'
      );

      const { ensureAstroBuild } = await loadEnsureAstroBuild('false');
      const execSpy = vi.fn();
      const logger = { log: vi.fn(), warn: vi.fn(), error: vi.fn() };

      ensureAstroBuild({ root, exec: execSpy, logger });

      expect(execSpy).not.toHaveBeenCalled();
      expect(logger.log).toHaveBeenCalledWith(
        'Astro build artifacts detected. Skipping rebuild.'
      );
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('rebuilds when existing artifacts marker differs from env flag', async () => {
    const root = createTempDir();
    try {
      createBuiltArtifacts(root);
      fs.writeFileSync(
        path.join(root, 'dist', '.quest-graph-debug-flag'),
        'false'
      );

      const { ensureAstroBuild } = await loadEnsureAstroBuild('true');
      const execSpy = vi.fn();
      const logger = { log: vi.fn(), warn: vi.fn(), error: vi.fn() };

      ensureAstroBuild({ root, exec: execSpy, logger });

      expect(execSpy).toHaveBeenCalledTimes(1);
      expect(logger.log).toHaveBeenCalledWith(
        'Build environment marker mismatch detected. Rebuilding Astro app...'
      );
      expect(
        fs
          .readFileSync(
            path.join(root, 'dist', '.quest-graph-debug-flag'),
            'utf8'
          )
          .trim()
      ).toBe('true');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('skips rebuild when existing DSPACE_ENV marker matches env flag', async () => {
    const root = createTempDir();
    try {
      createBuiltArtifacts(root);
      fs.writeFileSync(
        path.join(root, 'dist', '.quest-graph-debug-flag'),
        'false'
      );
      fs.writeFileSync(path.join(root, 'dist', '.dspace-env-flag'), 'dev');

      const { ensureAstroBuild } = await loadEnsureAstroBuild('false', 'DEV');
      const execSpy = vi.fn();
      const logger = { log: vi.fn(), warn: vi.fn(), error: vi.fn() };

      ensureAstroBuild({ root, exec: execSpy, logger });

      expect(execSpy).not.toHaveBeenCalled();
      expect(logger.log).toHaveBeenCalledWith(
        'Astro build artifacts detected. Skipping rebuild.'
      );
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('rebuilds when DSPACE_ENV marker is missing for an environment-specific build', async () => {
    const root = createTempDir();
    try {
      createBuiltArtifacts(root);
      fs.writeFileSync(
        path.join(root, 'dist', '.quest-graph-debug-flag'),
        'false'
      );

      const { ensureAstroBuild } = await loadEnsureAstroBuild('false', 'dev');
      const execSpy = vi.fn();
      const logger = { log: vi.fn(), warn: vi.fn(), error: vi.fn() };

      ensureAstroBuild({ root, exec: execSpy, logger });

      expect(execSpy).toHaveBeenCalledTimes(1);
      expect(logger.log).toHaveBeenCalledWith(
        'Build environment marker mismatch detected. Rebuilding Astro app...'
      );
      expect(
        fs
          .readFileSync(path.join(root, 'dist', '.dspace-env-flag'), 'utf8')
          .trim()
      ).toBe('dev');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
