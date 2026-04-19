import { spawnSync } from 'node:child_process';

const userAgent = process.env.npm_config_user_agent ?? '';
const isPnpm = userAgent.includes('pnpm/');

if (isPnpm) {
    process.exit(0);
}

const result = spawnSync('npm', ['--prefix', 'frontend', 'install'], {
    stdio: 'inherit',
    env: process.env,
});

if (result.error) {
    console.error('Failed to install frontend dependencies during postinstall.', result.error);
    process.exit(1);
}

if (result.status !== 0) {
    process.exit(result.status ?? 1);
}
