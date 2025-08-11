const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getDefaultBranch() {
  try {
    const info = execSync('git remote show origin', { stdio: ['pipe', 'pipe', 'ignore'] }).toString();
    const match = info.match(/HEAD branch: (.+)/);
    if (match) return match[1].trim();
  } catch {}
  return 'main';
}

function getChangedFiles() {
  const branch = getDefaultBranch();
  let base = '';
  try {
    base = execSync(`git merge-base origin/${branch} HEAD`, {
      stdio: ['pipe', 'pipe', 'ignore']
    }).toString().trim();
  } catch {
    try {
      base = execSync(`git merge-base ${branch} HEAD`, {
        stdio: ['pipe', 'pipe', 'ignore']
      }).toString().trim();
    } catch {}
  }
  if (!base) return [];
  const diff = execSync(`git diff --name-only ${base}`).toString();
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
  for (const file of changed) {
    const entry = Object.entries(summary).find(([key]) => key.endsWith(file));
    if (!entry) continue;
    const data = entry[1];
    const metrics = ['lines', 'statements', 'functions', 'branches'];
    metrics.forEach(m => {
      if (data[m] && data[m].pct < 100) {
        console.error(`${file} ${m} coverage ${data[m].pct}% is below 100%`);
        failed = true;
      }
    });
  }
  if (failed) {
    process.exit(1);
  } else {
    console.log('Patch coverage 100%');
  }
}
if (require.main === module) {
  checkCoverage();
}

module.exports = { getDefaultBranch };
