import { spawn } from 'node:child_process';
import readline from 'node:readline';

const isUnsupportedRouteWarning = (line) =>
    line.includes('Unsupported file type') && line.includes("Prefix filename with an underscore (`_`) to ignore");

const astro = spawn('astro', ['build'], {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true,
});

let suppressedWarnings = 0;

const pipeWithFilter = (stream, target) => {
    const rl = readline.createInterface({ input: stream });

    rl.on('line', (line) => {
        if (isUnsupportedRouteWarning(line)) {
            suppressedWarnings += 1;
            return;
        }

        target.write(`${line}\n`);
    });

    return rl;
};

const stdoutReader = pipeWithFilter(astro.stdout, process.stdout);
const stderrReader = pipeWithFilter(astro.stderr, process.stderr);

astro.on('close', (code) => {
    stdoutReader.close();
    stderrReader.close();

    if (suppressedWarnings > 0) {
        process.stderr.write(
            `[astro-build-clean] Suppressed ${suppressedWarnings} unsupported-file route warnings from src/pages data/helper files.\n`
        );
    }

    process.exit(code ?? 1);
});
