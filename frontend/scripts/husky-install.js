import { existsSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');

if (existsSync(path.join(repoRoot, '.git'))) {
    execSync('husky install', { cwd: repoRoot, stdio: 'inherit' });
}
