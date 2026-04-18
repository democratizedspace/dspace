import { spawn } from 'node:child_process';

const UNSUPPORTED_FILE_WARNING_FRAGMENT = 'Unsupported file type';
const UNDERSCORE_HINT_FRAGMENT = 'Prefix filename with an underscore (`_`) to ignore.';

const astro = spawn('astro', ['build'], {
    cwd: process.cwd(),
    env: process.env,
    shell: true,
    stdio: ['inherit', 'pipe', 'pipe'],
});

const forwardOutput = (chunk, writer) => {
    const text = chunk.toString();
    const lines = text.split('\n');
    const filtered = lines.filter((line) => {
        return !(
            line.includes(UNSUPPORTED_FILE_WARNING_FRAGMENT) &&
            line.includes(UNDERSCORE_HINT_FRAGMENT)
        );
    });

    if (filtered.length === 0) {
        return;
    }

    writer.write(filtered.join('\n'));
};

astro.stdout.on('data', (chunk) => forwardOutput(chunk, process.stdout));
astro.stderr.on('data', (chunk) => forwardOutput(chunk, process.stderr));

astro.on('close', (code, signal) => {
    if (signal) {
        process.kill(process.pid, signal);
        return;
    }

    process.exit(code ?? 1);
});
