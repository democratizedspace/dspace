import { spawn } from 'node:child_process';
import { createFilteredWriter } from './filter-known-node-warnings.mjs';

export function appendNodeOptions(env, options) {
    const requested = Array.isArray(options) ? options : [options];
    const existing = env.NODE_OPTIONS ? env.NODE_OPTIONS.split(/\s+/).filter(Boolean) : [];
    const combined = [...existing];

    for (const option of requested.filter(Boolean)) {
        if (!combined.includes(option)) {
            combined.push(option);
        }
    }

    return {
        ...env,
        NODE_OPTIONS: combined.join(' '),
    };
}

export async function runFilteredCommand(command, args = [], options = {}) {
    const {
        cwd = process.cwd(),
        env = process.env,
        filterOutput = true,
        shell = false,
        label = `${command} ${args.join(' ')}`.trim(),
    } = options;

    const child = spawn(command, args, {
        cwd,
        env,
        shell,
        stdio: ['inherit', 'pipe', 'pipe'],
    });

    const writeStdout = filterOutput
        ? createFilteredWriter(process.stdout)
        : (chunk) => process.stdout.write(chunk);
    const writeStderr = filterOutput
        ? createFilteredWriter(process.stderr)
        : (chunk) => process.stderr.write(chunk);

    child.stdout.on('data', (chunk) => writeStdout(chunk.toString()));
    child.stderr.on('data', (chunk) => writeStderr(chunk.toString()));

    return await new Promise((resolve, reject) => {
        child.on('error', reject);
        child.on('close', (code, signal) => {
            writeStdout('', true);
            writeStderr('', true);

            if (signal) {
                reject(new Error(`${label} exited due to signal ${signal}`));
                return;
            }

            if ((code ?? 1) !== 0) {
                const error = new Error(`${label} exited with code ${code ?? 1}`);
                error.code = code ?? 1;
                reject(error);
                return;
            }

            resolve();
        });
    });
}
