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

        if (flush && buffered) {
            if (shouldKeepLine(buffered)) {
                stream.write(buffered);
            }
            buffered = '';
        }
    };
};

const runAstroBuild = async () => {
    const child = spawn('astro', ['build'], {
        stdio: 'pipe',
        env: process.env,
        shell: true,
    });

    const writeStdout = createFilteredWriter(process.stdout);
    const writeStderr = createFilteredWriter(process.stderr);

    child.stdout.on('data', (chunk) => {
        writeStdout(chunk.toString());
    });

    child.stderr.on('data', (chunk) => {
        writeStderr(chunk.toString());
    });

    await new Promise((resolve, reject) => {
        child.on('error', reject);
        child.on('close', (code, signal) => {
            writeStdout('', true);
            writeStderr('', true);

            if (signal) {
                reject(new Error(`astro build exited due to signal ${signal}`));
                return;
            }

            if (code !== 0) {
                process.exit(code ?? 1);
                return;
            }

            resolve();
        });
    });
};

await runAstroBuild();
