import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

// keep package metadata in sync
execSync('npm run sync', { stdio: 'inherit' });

// skip husky install if disabled or repo metadata is missing
const gitDir = path.resolve(process.cwd(), '..', '.git');
if (process.env.HUSKY === '0' || !existsSync(gitDir)) {
    process.exit(0);
}

execSync('npx husky install', { stdio: 'inherit' });
