import { spawn } from 'node:child_process';
import readline from 'node:readline';

const UNSUPPORTED_FILE_WARNING =
    /\[WARN\] Unsupported file type .* Prefix filename with an underscore \(`_`\) to ignore\./;

const child = spawn('astro', ['build'], {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true,
    env: process.env,
});

let suppressedWarnings = 0;

const forwardStream = (stream, target) => {
    const rl = readline.createInterface({ input: stream });
    rl.on('line', (line) => {
        if (UNSUPPORTED_FILE_WARNING.test(line)) {
            suppressedWarnings += 1;
            return;
        }

        target.write(`${line}\n`);
    });
};

forwardStream(child.stdout, process.stdout);
forwardStream(child.stderr, process.stderr);

child.on('exit', (code) => {
    if (suppressedWarnings > 0) {
        process.stdout.write(
            `[astro-build] Suppressed ${suppressedWarnings} known unsupported-file warnings from src/pages helper/data files.\n`
        );
    }

    process.exit(code ?? 1);
});
