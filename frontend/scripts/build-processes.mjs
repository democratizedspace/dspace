import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import hardening from '../../common/hardening.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const basePath = path.join(root, 'src/pages/processes/base.json');
const hardeningDir = path.join(root, 'src/pages/processes/hardening');
const outPath = path.join(root, 'src/generated/processes.json');

const processes = JSON.parse(fs.readFileSync(basePath, 'utf8'));
fs.mkdirSync(hardeningDir, { recursive: true });

for (const proc of processes) {
  const hardPath = path.join(hardeningDir, `${proc.id}.json`);
  const hasFile = fs.existsSync(hardPath);
  const existing = hasFile
    ? JSON.parse(fs.readFileSync(hardPath, 'utf8'))
    : proc.hardening;
  const evaluationScore = hardening.evaluateProcessQuality(proc);
  const normalized = hardening.normalizeHardening(existing ?? hardening.defaultHardening, {
    minimumScore: evaluationScore,
  });
  proc.hardening = normalized;
  fs.writeFileSync(hardPath, JSON.stringify(normalized, null, 4) + '\n');
}
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(processes, null, 4) + '\n');

const { syncCacheVersion } = await import('./sync-cache-version.mjs');
const { injectCacheVersionIntoServiceWorker } = await import('./inject-cache-version-into-sw.mjs');

await syncCacheVersion();
await injectCacheVersionIntoServiceWorker();
