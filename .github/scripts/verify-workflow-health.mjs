const requiredWorkflows = [
    'build',
    'tests',
    'CI',
    'ci-sentinel',
];

const apiAuth = process.env.GH_API_AUTH;
const repo = process.env.REPO;
const sha = process.env.SHA;

if (!apiAuth || !repo || !sha) {
    throw new Error('Missing required environment variables: GH_API_AUTH, REPO, SHA');
}

const headers = {
    Authorization: `Bearer ${apiAuth}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function githubJson(url) {
    const response = await fetch(url, { headers });
    if (!response.ok) {
        throw new Error(`GitHub API request failed (${response.status}): ${url}`);
    }
    return response.json();
}

function summarizeRunsForSha(runs) {
    const byName = new Map();

    for (const run of runs) {
        if (run.head_sha !== sha) {
            continue;
        }

        const existing = byName.get(run.name);
        if (!existing || run.run_number > existing.run_number) {
            byName.set(run.name, run);
        }
    }

    return byName;
}

async function waitForWorkflowCompletion() {
    const timeoutMs = 20 * 60 * 1000;
    const pollIntervalMs = 15 * 1000;
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
        const data = await githubJson(
            `https://api.github.com/repos/${repo}/actions/runs?per_page=100&head_sha=${sha}`
        );

        const runsByName = summarizeRunsForSha(data.workflow_runs ?? []);

        const missing = requiredWorkflows.filter((name) => !runsByName.has(name));
        const inProgress = requiredWorkflows.filter((name) => {
            const run = runsByName.get(name);
            return run && run.status !== 'completed';
        });

        if (missing.length === 0 && inProgress.length === 0) {
            return runsByName;
        }

        console.log(
            `Waiting on workflows for ${sha}. Missing: ${missing.join(', ') || 'none'}. ` +
                `In progress: ${inProgress.join(', ') || 'none'}.`
        );

        await sleep(pollIntervalMs);
    }

    throw new Error(`Timed out waiting for workflows to complete for ${sha}`);
}

const runsByName = await waitForWorkflowCompletion();

const failed = [];
for (const name of requiredWorkflows) {
    const run = runsByName.get(name);
    if (!run) {
        failed.push(`${name} (missing run)`);
        continue;
    }

    const okConclusions = new Set(['success', 'skipped']);
    if (!okConclusions.has(run.conclusion)) {
        failed.push(`${name} (${run.conclusion ?? 'no conclusion'})`);
    }
}

if (failed.length > 0) {
    throw new Error(`Critical workflows failed or missing: ${failed.join(', ')}`);
}

console.log(`All critical workflows passed for ${sha}: ${requiredWorkflows.join(', ')}`);
