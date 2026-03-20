import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const cwd = process.cwd();
const frontendRoot = path.resolve(cwd);
const playwrightCli = path.join(frontendRoot, 'node_modules', '@playwright', 'test', 'cli.js');

function parseArgs(argv) {
    const parsed = {
        baseURL: process.env.BASE_URL || '',
        chatMode: process.env.REMOTE_SMOKE_CHAT_MODE || 'ui',
        enableMutations: process.env.REMOTE_SMOKE_ENABLE_MUTATIONS || '0',
        extraArgs: [],
    };

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (arg.startsWith('--baseURL=')) {
            parsed.baseURL = arg.split('=')[1] || '';
        } else if (arg === '--baseURL') {
            parsed.baseURL = argv[i + 1] || '';
            i += 1;
        } else if (arg.startsWith('--chat-mode=')) {
            parsed.chatMode = arg.split('=')[1] || 'ui';
        } else if (arg === '--chat-mode') {
            parsed.chatMode = argv[i + 1] || 'ui';
            i += 1;
        } else if (arg === '--mutations') {
            parsed.enableMutations = '1';
        } else {
            parsed.extraArgs.push(arg);
        }
    }

    return parsed;
}

function summarizeSuite(jsonPath, markdownPath, context) {
    const report = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const suiteResults = [];

    const walkSuites = (suite, pathParts = []) => {
        for (const nestedSuite of suite.suites || []) {
            walkSuites(nestedSuite, [...pathParts, nestedSuite.title].filter(Boolean));
        }

        for (const spec of suite.specs || []) {
            const specTitle = [...pathParts, spec.title].join(' › ');
            for (const test of spec.tests || []) {
                const result = test.results?.[0] || {};
                suiteResults.push({
                    title: specTitle,
                    status: result.status || test.status || 'unknown',
                    durationMs: result.duration || 0,
                });
            }
        }
    };

    for (const suite of report.suites || []) {
        walkSuites(suite);
    }

    const totals = suiteResults.reduce(
        (acc, testResult) => {
            acc.total += 1;
            if (testResult.status === 'passed') acc.passed += 1;
            else if (testResult.status === 'skipped') acc.skipped += 1;
            else acc.failed += 1;
            return acc;
        },
        { total: 0, passed: 0, failed: 0, skipped: 0 }
    );

    const lines = [
        '# Remote Smoke Summary',
        '',
        `- Base URL: ${context.baseURL || 'http://127.0.0.1:4173'}`,
        `- Chat mode: ${context.chatMode}`,
        `- Mutations enabled: ${context.enableMutations === '1' ? 'yes' : 'no'}`,
        `- Totals: ${totals.passed} passed / ${totals.failed} failed / ${totals.skipped} skipped`,
        '',
        '## Tests',
        '',
    ];

    for (const testResult of suiteResults) {
        const icon =
            testResult.status === 'passed' ? '✅' : testResult.status === 'skipped' ? '⚪' : '❌';
        lines.push(
            `- ${icon} ${testResult.title} (${testResult.status}, ${testResult.durationMs}ms)`
        );
    }

    fs.mkdirSync(path.dirname(markdownPath), { recursive: true });
    fs.writeFileSync(markdownPath, `${lines.join('\n')}\n`, 'utf8');
}

function main() {
    if (!fs.existsSync(playwrightCli)) {
        console.error(`Playwright CLI not found at ${playwrightCli}. Run pnpm install first.`);
        process.exit(1);
    }

    const parsed = parseArgs(process.argv.slice(2));
    const resultsDir = path.join(frontendRoot, 'test-results', 'remote-smoke');
    const jsonReportPath = path.join(resultsDir, 'results.json');
    const markdownSummaryPath = path.join(resultsDir, 'summary.md');

    fs.mkdirSync(resultsDir, { recursive: true });

    const env = {
        ...process.env,
        PLAYWRIGHT_REMOTE: '1',
        BASE_URL: parsed.baseURL || process.env.BASE_URL || 'http://127.0.0.1:4173',
        REMOTE_SMOKE_CHAT_MODE: parsed.chatMode,
        REMOTE_SMOKE_ENABLE_MUTATIONS: parsed.enableMutations,
    };

    const args = [
        playwrightCli,
        'test',
        'e2e/remote-release-smoke.spec.ts',
        '--reporter=list,json',
        '--output=test-artifacts/remote-smoke',
        ...parsed.extraArgs,
    ];

    const run = spawnSync('node', args, {
        cwd: frontendRoot,
        env,
        stdio: 'inherit',
    });

    const defaultJsonReport = path.join(frontendRoot, 'test-results.json');
    if (fs.existsSync(defaultJsonReport)) {
        fs.copyFileSync(defaultJsonReport, jsonReportPath);
        fs.rmSync(defaultJsonReport);
    }

    if (fs.existsSync(jsonReportPath)) {
        summarizeSuite(jsonReportPath, markdownSummaryPath, {
            baseURL: env.BASE_URL,
            chatMode: env.REMOTE_SMOKE_CHAT_MODE,
            enableMutations: env.REMOTE_SMOKE_ENABLE_MUTATIONS,
        });
        console.log(`Remote smoke summary written to ${markdownSummaryPath}`);
    }

    process.exit(run.status ?? 1);
}

main();
