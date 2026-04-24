import { spawn } from 'node:child_process';

const astroArgs = process.argv.slice(2);

if (astroArgs.length === 0) {
    console.error('Usage: node scripts/run-astro-with-filter.mjs <astro-args...>');
    process.exit(1);
}

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

const astro = spawn('astro', astroArgs, {
    stdio: 'pipe',
    env: process.env,
    shell: true,
});

const writeStdout = createFilteredWriter(process.stdout);
const writeStderr = createFilteredWriter(process.stderr);

astro.stdout.on('data', (chunk) => {
    writeStdout(chunk.toString());
});

astro.stderr.on('data', (chunk) => {
    writeStderr(chunk.toString());
});

astro.on('close', (code, signal) => {
    writeStdout('', true);
    writeStderr('', true);

    if (signal) {
        console.error(`astro exited due to signal ${signal}`);
        process.exit(1);
    }

    process.exit(code ?? 1);
});
