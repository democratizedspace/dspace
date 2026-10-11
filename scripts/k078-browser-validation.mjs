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
        const db = await new Promise((resolve, reject) => {
          const req = indexedDB.open('CustomContent', 3);
          req.onupgradeneeded = () => {
            for (const name of ['items', 'processes', 'quests'])
              req.result.createObjectStore(name, { keyPath: 'id' });
            req.result.createObjectStore('meta').put(3, 'schemaVersion');
          };
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });
        db.close();
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
        const cleared = await common.clearCredential('github');
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
      await page.evaluate(async () => {
        const common = await import('/frontend/src/utils/gameState/common.js');
        await common.saveCredential('github', 'SENTINEL_CROSS_TAB');
      });
      const second = await context.newPage();
      await second.goto(origin + '/k078-harness');
      await second.evaluate(async () => {
        const common = await import('/frontend/src/utils/gameState/common.js');
        await common.ready;
        globalThis.staleK078 = common.loadGameState();
      });
      await page.evaluate(async () => {
        const common = await import('/frontend/src/utils/gameState/common.js');
        if ((await common.clearCredential('github')).status !== 'complete')
          throw new Error('cross-tab clear');
      });
      await second.evaluate(async () => {
        const common = await import('/frontend/src/utils/gameState/common.js');
        try {
          await common.saveGameState(globalThis.staleK078);
          throw new Error('stale tab accepted');
        } catch (e) {
          if (e.code !== 'stale-credential-epoch') throw e;
        }
        await common.saveCredential('github', 'SENTINEL_CROSS_TAB_NEW');
        if (common.loadGameState().github.token !== 'SENTINEL_CROSS_TAB_NEW')
          throw new Error('deliberate cross-tab save');
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
      evidence.profiles.push({ name, status: 'failed', error: error.message });
      console.error(JSON.stringify({ profile: name, error: error.message }));
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
