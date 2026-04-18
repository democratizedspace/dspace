import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { parse } from 'yaml';

const repoRoot = process.cwd();
const workflowsDir = process.env.WORKFLOWS_DIR || path.join(repoRoot, '.github', 'workflows');

const requiredWorkflows = [
  'build.yml',
  'ci.yml',
  'tests.yml',
  'ci-image.yml',
  'ci-sentinel.yml',
  'link-check.yml',
];

const errors = [];
const requiredLaunchGateCommands = [
  'npm run lint',
  'npm run type-check',
  'npm run build',
  'npm test',
  'node scripts/link-check.mjs',
];

function asArray(value) {
  if (value === undefined || value === null) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function pushConfigIncludesMain(pushConfig) {
  if (pushConfig === undefined || pushConfig === null || pushConfig === false) {
    return false;
  }

  if (pushConfig === true) {
    return true;
  }

  if (typeof pushConfig !== 'object') {
    return true;
  }

  const pushBranches = asArray(pushConfig.branches);
  const pushBranchesIgnore = asArray(pushConfig['branches-ignore']);

  if (pushBranches.length > 0) {
    return pushBranches.includes('main');
  }

  if (pushBranchesIgnore.length > 0) {
    return !pushBranchesIgnore.includes('main');
  }

  return true;
}

const workflowFiles = readdirSync(workflowsDir)
  .filter((name) => name.endsWith('.yml') || name.endsWith('.yaml'))
  .sort();

for (const workflow of requiredWorkflows) {
  if (!workflowFiles.includes(workflow)) {
    errors.push(`Missing required workflow: ${workflow}`);
  }
}

for (const workflowFile of workflowFiles) {
  const workflowPath = path.join(workflowsDir, workflowFile);
  const contents = readFileSync(workflowPath, 'utf8');

  let parsed;
  try {
    parsed = parse(contents);
  } catch (error) {
    errors.push(`Invalid YAML in ${workflowFile}: ${error.message}`);
    continue;
  }

  if (!parsed || typeof parsed !== 'object') {
    errors.push(`Workflow ${workflowFile} does not parse to an object`);
    continue;
  }

  const events = parsed.on;
  if (!events || typeof events !== 'object') {
    errors.push(`Workflow ${workflowFile} is missing a valid 'on' block`);
    continue;
  }

  if (
    requiredWorkflows.includes(workflowFile) &&
    (events.pull_request === undefined || events.pull_request === false)
  ) {
    errors.push(`Workflow ${workflowFile} must trigger on pull_request`);
  }

  const prBranchesRaw = events.pull_request;
  if (prBranchesRaw === undefined) {
    continue;
  }

  if (pushConfigIncludesMain(events.push)) {
    if (prBranchesRaw === false) {
      errors.push(
        `Workflow ${workflowFile} pushes to main but has invalid pull_request configuration`
      );
      continue;
    }

    const prBranches = asArray(prBranchesRaw?.branches);
    const prIsUnfiltered =
      prBranchesRaw === null ||
      prBranchesRaw === true ||
      (typeof prBranchesRaw === 'object' && prBranches.length === 0);

    if (!prIsUnfiltered && !prBranches.includes('main')) {
      errors.push(
        `Workflow ${workflowFile} pushes to main but pull_request.branches does not include main`
      );
    }
  }

  if (workflowFile === 'ci.yml') {
    for (const command of requiredLaunchGateCommands) {
      if (!contents.includes(command)) {
        errors.push(`Workflow ci.yml must include launch-gate command: ${command}`);
      }
    }
  }
}

if (errors.length > 0) {
  console.error('Workflow integrity check failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Workflow integrity check passed for ${workflowFiles.length} workflow file(s).`);
