import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const { DEFAULT_HARDENING, normalizeHardening } = require('../../scripts/hardening.js');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const basePath = path.join(root, 'src/pages/processes/base.json');
const hardeningDir = path.join(root, 'src/pages/processes/hardening');
const outPath = path.join(root, 'src/generated/processes.json');

const processes = JSON.parse(fs.readFileSync(basePath, 'utf8'));
for (const proc of processes) {
  const hardPath = path.join(hardeningDir, `${proc.id}.json`);
  if (fs.existsSync(hardPath)) {
    proc.hardening = normalizeHardening(JSON.parse(fs.readFileSync(hardPath, 'utf8')));
  } else if (proc.hardening) {
    proc.hardening = normalizeHardening(proc.hardening);
  } else {
    proc.hardening = { ...DEFAULT_HARDENING };
  }
}
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(processes, null, 4) + '\n');

const { syncCacheVersion } = await import('./sync-cache-version.mjs');
const { injectCacheVersionIntoServiceWorker } = await import('./inject-cache-version-into-sw.mjs');

await syncCacheVersion();
await injectCacheVersionIntoServiceWorker();
