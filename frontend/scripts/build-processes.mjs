import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  DEFAULT_HARDENING,
  evaluateProcessQuality,
  normalizeHardening,
} from '../src/utils/hardening.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const basePath = path.join(root, 'src/pages/processes/base.json');
const hardeningDir = path.join(root, 'src/pages/processes/hardening');
const outPath = path.join(root, 'src/generated/processes.json');

const processes = JSON.parse(fs.readFileSync(basePath, 'utf8'));
for (const proc of processes) {
  const hardPath = path.join(hardeningDir, `${proc.id}.json`);
  const expectedScore = evaluateProcessQuality(proc);
  let hardening = proc.hardening ?? DEFAULT_HARDENING;
  if (fs.existsSync(hardPath)) {
    hardening = JSON.parse(fs.readFileSync(hardPath, 'utf8'));
  }
  proc.hardening = normalizeHardening(hardening, { expectedScore });
}
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(processes, null, 4) + '\n');

const { syncCacheVersion } = await import('./sync-cache-version.mjs');
const { injectCacheVersionIntoServiceWorker } = await import('./inject-cache-version-into-sw.mjs');

await syncCacheVersion();
await injectCacheVersionIntoServiceWorker();
