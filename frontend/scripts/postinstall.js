import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const DEFAULT_TIMEOUT_MS = 2 * 60 * 1000;

export function shouldSkipHusky({
    env = process.env,
    gitDir = path.resolve(process.cwd(), '..', '.git'),
    fsExists = existsSync,
} = {}) {
    if (
        env.HUSKY === '0' ||
        env.SKIP_HUSKY === '1' ||
        env.CI === 'true' ||
        env.DSPACE_SKIP_HUSKY === '1'
    ) {
        return true;
    }

    return !fsExists(gitDir);
}

export function runPostinstall({
    exec = execSync,
    env = process.env,
    gitDir = path.resolve(process.cwd(), '..', '.git'),
    fsExists = existsSync,
    timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) {
    exec('npm run sync', { stdio: 'inherit', timeout: timeoutMs });

    if (shouldSkipHusky({ env, gitDir, fsExists })) {
        return false;
    }

    exec('npx husky install', { stdio: 'inherit', timeout: timeoutMs });
    return true;
}

const modulePath = fileURLToPath(import.meta.url);
const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;

if (invokedPath === modulePath) {
    runPostinstall();
}
