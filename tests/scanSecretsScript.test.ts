import { execSync, spawnSync } from 'node:child_process';
import { expect, test } from 'vitest';

function hasPython3() {
    const result = spawnSync('python3', ['--version'], { stdio: 'ignore' });
    return result.status === 0;
}

function runScanner(diff: string) {
    return execSync('python3 scripts/scan-secrets.py', {
        input: diff,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
    });
}

test.runIf(hasPython3())('scan-secrets script exits cleanly for safe diff', () => {
    const safeDiff = [
        'diff --git a/example.txt b/example.txt',
        '--- a/example.txt',
        '+++ b/example.txt',
        '+const greeting = "hello";',
        ''
    ].join('\n');

    expect(() => runScanner(safeDiff)).not.toThrow();
});

test.runIf(hasPython3())('scan-secrets script flags credential-like additions', () => {
    const secretLine = "+const token = 'sk-test-abc1234567890'; // scan-secrets: ignore";
    const secretDiff = [
        'diff --git a/app.js b/app.js',
        '--- a/app.js',
        '+++ b/app.js',
        secretLine.replace(' // scan-secrets: ignore', ''),
        ''
    ].join('\n');

    expect(() => runScanner(secretDiff)).toThrow(/Potential secret/i);
});
