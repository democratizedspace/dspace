import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium, firefox, webkit } from '@playwright/test';
const require = createRequire(import.meta.url);
const viteRequire = createRequire(require.resolve('vitest/package.json'));
const vite = await import(pathToFileURL(viteRequire.resolve('vite')).href);
const { createServer } = vite.default ?? vite;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const server = await createServer({
  configFile: false,
  root,
  server: { host: '127.0.0.1', port: 0 },
  logLevel: 'error',
});
server.middlewares.use('/k078-harness', (_req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.end('<!doctype html><title>Synthetic K078</title>');
});
await server.listen();
const origin = server.resolvedUrls.local[0].replace(/\/$/, '');
const evidence = {
  head: execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: root,
    encoding: 'utf8',
  }).trim(),
  dirty: Boolean(
    execFileSync('git', ['status', '--porcelain'], {
      cwd: root,
      encoding: 'utf8',
    }).trim()
  ),
  generatedAt: new Date().toISOString(),
  profiles: [],
};
try {
  for (const [name, engine, constrained] of [
    ['chromium', chromium, false],
    ['firefox', firefox, false],
    ['webkit', webkit, false],
    ['chromium-128MiB-heap-4xCPU', chromium, true],
  ]) {
    if (
      process.env.K078_BROWSER_FILTER &&
      name !== process.env.K078_BROWSER_FILTER
    )
      continue;
    let stage = 'primary import and Clear sequence';
    const browserServer = await engine.launchServer({
      headless: true,
      ...(constrained ? { args: ['--js-flags=--max-old-space-size=128'] } : {}),
    });
    const browser = await engine.connect(browserServer.wsEndpoint());
    try {
      const context = await browser.newContext();
      await context.route('**/*', async (route) => {
        if (
          !route
            .request()
            .url()
            .startsWith(origin + '/')
        )
          return route.abort();
        if (route.request().url() === origin + '/k078-harness')
          return route.fulfill({
            status: 200,
            contentType: 'text/html; charset=utf-8',
            body: '<!doctype html><title>Synthetic K078</title>',
          });
        return route.fulfill({ response: await route.fetch() });
      });
      const page = await context.newPage();
      if (constrained) {
        const cdp = await context.newCDPSession(page);
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      }
      await page.goto(origin + '/k078-harness');
      const result = await page.evaluate(async () => {
        const prep = await import('/frontend/src/utils/importPreparation.js');
        const storage =
          await import('/frontend/src/utils/managedImportStorage.js');
        const common = await import('/frontend/src/utils/gameState/common.js');
        await common.ready;
        const assert = (v, message) => {
          if (!v) throw new Error(message);
        };
        const customStorage = await import('/frontend/src/utils/indexeddb.js');
        await customStorage.initializeCustomContentForImportUI();
        assert(
          localStorage.getItem('gameStateLite'),
          'normal startup lightweight snapshot'
        );
        await common.saveCredential('github', 'SENTINEL_GITHUB_A');
        await common.saveCredential('openAI', 'SENTINEL_OPENAI_B');
        const cases = [],
          memorySamples = [];
        for (const count of [1, 100, 1000, 2000]) {
          const payload = {
            schemaVersion: 1,
            payload: {
              inventory: Object.fromEntries(
                Array.from({ length: count }, (_, i) => [`synthetic-${i}`, i])
              ),
            },
            customContent: {
              schemaVersion: 1,
              items: Array.from({ length: count }, (_, i) => ({
                id: `item-${i}`,
                name: `Synthetic item ${i}`,
                description: 'Generated synthetic compatibility record.',
              })),
            },
          };
          const text = JSON.stringify(payload),
            start = performance.now();
          const plan = prep.prepareImport(text, { origin: location.origin });
          const preparationMs = performance.now() - start;
          const commitStart = performance.now();
          const receipt = await common.importGameStateString(text);
          assert(receipt.status === 'complete', 'commit receipt');
          assert(
            common.loadGameState().github.token === 'SENTINEL_GITHUB_A',
            'destination credential preservation'
          );
          cases.push({
            count,
            bytes: new TextEncoder().encode(text).length,
            preparationMs,
            commitMs: performance.now() - commitStart,
          });
          if (performance.memory)
            memorySamples.push(performance.memory.usedJSHeapSize);
        }
        const before = localStorage.getItem('gameState');
        try {
          await common.importGameStateString(
            '{"payload":{},"customContent":{"schemaVersion":1,"items":false}}'
          );
          throw new Error('accepted invalid');
        } catch (e) {
          assert(e.name === 'ImportPreparationError', 'typed invalid');
        }
        assert(
          localStorage.getItem('gameState') === before,
          'invalid caused a write'
        );
        const stale = common.loadGameState();
        const clearing = common.clearCredential('github');
        const freshDuringClear = common.loadGameState();
        freshDuringClear.inventory.pendingClearGameplay = 1;
        const [cleared] = await Promise.all([
          clearing,
          common.saveGameState(freshDuringClear),
        ]);
        assert(
          common.loadGameState().inventory.pendingClearGameplay === 1,
          'gameplay during Clear lost'
        );
        assert(cleared.status === 'complete', 'clear complete');
        try {
          await common.saveGameState(stale);
          throw new Error('accepted stale');
        } catch (e) {
          assert(e.code === 'stale-credential-epoch', 'epoch conflict');
        }
        await common.rollbackGameState();
        assert(
          !common.loadGameState().github?.token,
          'rollback revived credential'
        );
        assert(
          common.loadGameState().openAI.apiKey === 'SENTINEL_OPENAI_B',
          'other credential lost'
        );
        const gameDb = await storage.openManagedGameDB();
        const stored = await storage.readManagedGame(gameDb);
        assert(
          !JSON.stringify(stored).includes('SENTINEL_GITHUB_A'),
          'retained credential'
        );
        gameDb.close();
        return {
          cases,
          limits: prep.IMPORT_LIMITS,
          assertions:
            'preparation, complete transactions, destination preservation, invalid no-write, clear, stale write, rollback',
          sampledMaxJSHeapBytes: memorySamples.length
            ? Math.max(...memorySamples)
            : null,
        };
      });
      stage = 'cross-tab setup credential';
      await page.evaluate(async () => {
        const common = await import('/frontend/src/utils/gameState/common.js');
        await common.saveCredential('github', 'SENTINEL_CROSS_TAB');
      });
      stage = 'cross-tab stale capture';
      const second = await context.newPage();
      await second.goto(origin + '/k078-harness');
      await second.evaluate(async () => {
        const common = await import('/frontend/src/utils/gameState/common.js');
        await common.ready;
        globalThis.staleK078 = common.loadGameState();
        let savedDuringRefresh = false;
        common.state.subscribe((value) => {
          if (!savedDuringRefresh && !value.github?.token) {
            savedDuringRefresh = true;
            const fresh = common.loadGameState();
            fresh.inventory.crossTabRefreshGameplay = 1;
            globalThis.refreshGameplay = common.saveGameState(fresh);
          }
        });
        globalThis.clearNotified = new Promise((resolve) =>
          window.addEventListener('dspace-credential-cleared', resolve, {
            once: true,
          })
        );
      });
      stage = 'cross-tab Clear';
      await page.evaluate(async () => {
        const common = await import('/frontend/src/utils/gameState/common.js');
        if ((await common.clearCredential('github')).status !== 'complete')
          throw new Error('cross-tab clear');
      });
      stage = 'cross-tab stale rejection and fresh save';
      await second.evaluate(async () => {
        const common = await import('/frontend/src/utils/gameState/common.js');
        try {
          await common.saveGameState(globalThis.staleK078);
          throw new Error('stale tab accepted');
        } catch (e) {
          if (e.code !== 'stale-credential-epoch') throw e;
        }
        await globalThis.clearNotified;
        await globalThis.refreshGameplay;
        if (common.loadGameState().inventory.crossTabRefreshGameplay !== 1)
          throw new Error('gameplay during cross-tab refresh lost');
        const fresh = common.loadGameState();
        fresh.inventory.syntheticAfterClear = 1;
        await common.saveGameState(fresh);
        await common.saveCredential('github', 'SENTINEL_CROSS_TAB_NEW');
        if (common.loadGameState().github.token !== 'SENTINEL_CROSS_TAB_NEW')
          throw new Error('deliberate cross-tab save');
      });
      stage = 'cross-tab mirror refresh and consecutive saves';
      const mirroredEpoch = await second.evaluate(
        () =>
          JSON.parse(localStorage.getItem('gameStateLite')).credentialEpochs
            .github.epoch
      );
      await page.waitForFunction((epoch) => {
        const state = JSON.parse(localStorage.getItem('gameState') || '{}');
        const meta = JSON.parse(localStorage.getItem('gameStateLite') || '{}');
        const marker = localStorage.getItem('gameStateChecksum');
        return (
          meta.credentialEpochs?.github?.epoch === epoch &&
          meta.checksum === marker &&
          state._meta?.checksum === marker
        );
      }, mirroredEpoch);
      await page.evaluate(async () => {
        const common = await import('/frontend/src/utils/gameState/common.js');
        common.syncGameStateFromLocalIfStale();
        const first = common.loadGameState();
        first.inventory.crossTabGameplay = 1;
        const a = common.saveGameState(first);
        const second = common.loadGameState();
        second.inventory.crossTabGameplay = 2;
        await Promise.all([a, common.saveGameState(second)]);
        if (common.loadGameState().inventory.crossTabGameplay !== 2)
          throw new Error('cross-tab gameplay lost');
      });
      await second.close();
      const processPeakWorkingSetBytes =
        process.platform === 'win32'
          ? Number(
              execFileSync(
                'powershell.exe',
                [
                  '-NoProfile',
                  '-NonInteractive',
                  '-Command',
                  `(Get-Process -Id ${browserServer.process().pid}).PeakWorkingSet64`,
                ],
                { encoding: 'utf8' }
              ).trim()
            )
          : null;
      evidence.profiles.push({
        name,
        browserVersion: browser.version(),
        processPeakWorkingSetBytes,
        memoryScope:
          'browser main process peak working set; sampled JS heap is separate, neither is whole-device peak',
        crossTab:
          'stale save rejected; deliberate later credential save accepted',
        ...result,
      });
      console.log(
        JSON.stringify({
          profile: name,
          cases: result.cases,
          sampledMaxJSHeapBytes: result.sampledMaxJSHeapBytes,
        })
      );
      await context.close();
    } catch (error) {
      evidence.profiles.push({
        name,
        status: 'failed',
        stage,
        error: error.message,
      });
      console.error(
        JSON.stringify({ profile: name, stage, error: error.message })
      );
    } finally {
      await browser.close();
      await browserServer.close();
    }
  }
} finally {
  await server.close();
  await fs.mkdir(path.join(root, 'artifacts'), { recursive: true });
  await fs.writeFile(
    path.join(root, 'artifacts/k078-browser-evidence.json'),
    JSON.stringify(evidence, null, 2)
  );
}

if (evidence.profiles.some((profile) => profile.status === 'failed'))
  process.exitCode = 1;
