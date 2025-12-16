const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const BRANCH_NAME_PATTERN = /^[\w./-]+$/;

function getSanitizedBranch(value) {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed || !BRANCH_NAME_PATTERN.test(trimmed)) return '';
  return trimmed;
}

function getDefaultBranch() {
  const envBase =
    getSanitizedBranch(process.env.PATCH_COVERAGE_BASE) ||
    getSanitizedBranch(process.env.GITHUB_BASE_REF);
  if (envBase) return envBase;
  try {
    const info = cp.execFileSync('git', ['remote', 'show', 'origin'], {
      stdio: ['pipe', 'pipe', 'ignore']
    }).toString();
    const match = info.match(/HEAD branch: (.+)/);
    if (match) return match[1].trim();
  } catch {}
  try {
    return cp.execFileSync('git', ['symbolic-ref', '--short', 'HEAD'], {
      stdio: ['pipe', 'pipe', 'ignore']
    })
      .toString()
      .trim();
  } catch {}
  return 'main';
}

function getChangedFiles() {
  const branch = getDefaultBranch();
  let base = '';
  const hasOrigin = (() => {
    try {
      cp.execFileSync('git', ['remote', 'get-url', 'origin'], {
        stdio: ['pipe', 'pipe', 'ignore']
      });
      return true;
    } catch {
      return false;
    }
  })();
  try {
    const target = hasOrigin ? `origin/${branch}` : branch;
    base = cp
      .execFileSync('git', ['merge-base', target, 'HEAD'], {
        stdio: ['pipe', 'pipe', 'ignore']
      })
      .toString()
      .trim();
  } catch {}
  if (!base) return [];
  const diff = cp
    .execFileSync('git', ['diff', '--name-only', base], {
      stdio: ['pipe', 'pipe', 'ignore']
    })
    .toString();
  return diff.split('\n').filter(Boolean);
}

function loadCoverage() {
  const coveragePath = path.join(__dirname, '..', 'frontend', 'coverage', 'coverage-summary.json');
  if (!fs.existsSync(coveragePath)) {
    console.error(`Coverage file not found at ${coveragePath}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
}

function checkCoverage() {
  const changed = getChangedFiles();
  if (changed.length === 0) return;
  const summary = loadCoverage();
  let failed = false;
  const threshold = 90;
  for (const file of changed) {
    const entry = Object.entries(summary).find(([key]) => key.endsWith(file));
    if (!entry) continue;
    const data = entry[1];
    const metrics = ['lines', 'statements', 'functions', 'branches'];
    metrics.forEach(m => {
      if (data[m] && data[m].pct < threshold) {
        console.error(`${file} ${m} coverage ${data[m].pct}% is below ${threshold}%`);
        failed = true;
      }
    });
  }
  if (failed) {
    process.exit(1);
  } else {
    console.log(`Patch coverage ≥ ${threshold}%`);
  }
}
if (require.main === module) {
  checkCoverage();
}

module.exports = { getDefaultBranch, getChangedFiles };
