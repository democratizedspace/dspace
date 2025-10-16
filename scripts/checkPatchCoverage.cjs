const fs = require('fs');
const path = require('path');
const cp = require('child_process');

function getDefaultBranch() {
  try {
    const info = cp.execSync('git remote show origin', {
      stdio: ['pipe', 'pipe', 'ignore']
    }).toString();
    const match = info.match(/HEAD branch: (.+)/);
    if (match) return match[1].trim();
  } catch {}
  try {
    return cp.execSync('git symbolic-ref --short HEAD', {
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
      cp.execSync('git remote get-url origin', {
        stdio: ['pipe', 'pipe', 'ignore']
      });
      return true;
    } catch {
      return false;
    }
  })();
  try {
    const target = hasOrigin ? `origin/${branch}` : branch;
    base = cp.execSync(`git merge-base ${target} HEAD`, {
      stdio: ['pipe', 'pipe', 'ignore']
    })
      .toString()
      .trim();
  } catch {}
  if (!base) return [];
  const diff = cp.execSync(`git diff --name-only ${base}`).toString();
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
