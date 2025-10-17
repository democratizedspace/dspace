import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import ensureAstroBuild from './ensure-astro-build.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

ensureAstroBuild();

const npmExecutable = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const previewProcess = spawn(npmExecutable, ['run', 'preview:serve'], {
    cwd: rootDir,
    stdio: 'inherit',
    env: process.env,
});

const terminate = (signal) => {
    if (previewProcess.killed) {
        return;
    }

    previewProcess.kill(signal);
};

process.on('SIGINT', terminate);
process.on('SIGTERM', terminate);

previewProcess.on('exit', (code, signal) => {
    if (signal) {
        process.kill(process.pid, signal);
        return;
    }

    process.exit(code ?? 0);
});

previewProcess.on('error', (error) => {
    console.error('Failed to start Astro preview server:', error);
    process.exit(1);
});
