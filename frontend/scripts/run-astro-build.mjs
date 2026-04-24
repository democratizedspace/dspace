import { spawn } from 'node:child_process';

const ignoredPatterns = [/Unsupported file type .*Prefix filename with an underscore/];

const shouldKeepLine = (line) => !ignoredPatterns.some((pattern) => pattern.test(line));

const createFilteredWriter = (stream) => {
    let buffered = '';

    return (chunk, flush = false) => {
        buffered += chunk;
        const parts = buffered.split('\n');
        buffered = parts.pop() ?? '';

        for (const line of parts) {
            if (shouldKeepLine(line)) {
                stream.write(`${line}\n`);
            }
        }

        if (flush && buffered && shouldKeepLine(buffered)) {
            stream.write(buffered);
            buffered = '';
        }
    };
};

const child = spawn('astro', ['build'], {
    env: process.env,
    stdio: 'pipe',
    shell: true,
});

const writeStdout = createFilteredWriter(process.stdout);
const writeStderr = createFilteredWriter(process.stderr);

child.stdout.on('data', (chunk) => writeStdout(chunk.toString()));
child.stderr.on('data', (chunk) => writeStderr(chunk.toString()));

child.on('close', (code, signal) => {
    writeStdout('', true);
    writeStderr('', true);

    if (signal) {
        console.error(`astro build exited due to signal ${signal}`);
        process.exit(1);
    }

    process.exit(code ?? 1);
});

child.on('error', (error) => {
    console.error('Failed to run astro build:', error);
    process.exit(1);
});
