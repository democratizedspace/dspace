const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const QUEST_DIR = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'quests', 'json');
const BASE_COMMIT = 'd956e807d49114da2d0ff28aacef91341813bf82'; // v2.1

function listQuestFiles(commit) {
  if (commit) {
    const output = execSync(
      `git ls-tree -r --name-only ${commit} ${QUEST_DIR}`,
      { encoding: 'utf8' }
    );
    return output.trim().split(/\n/).filter(Boolean);
  }
  return readJsonFiles(QUEST_DIR);
}

function readJsonFiles(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return readJsonFiles(full);
      return entry.name.endsWith('.json') ? [full] : [];
    });
}

module.exports = {
  listQuestFiles,
  BASE_COMMIT,
};

function main() {
  const v21Files = listQuestFiles(BASE_COMMIT);
  const headFiles = listQuestFiles();
  const ratio = headFiles.length / v21Files.length;
  console.log(`Quests in v2.1 (${BASE_COMMIT.slice(0,7)}): ${v21Files.length}`);
  console.log(`Quests in current HEAD: ${headFiles.length}`);
  console.log(`Ratio: ${ratio.toFixed(2)}x`);
  if (ratio >= 10) {
    console.log('✅ The quest count increased by at least 10x.');
  } else {
    console.log('⚠️ Quest count has not yet increased by 10x.');
  }
}

if (require.main === module) {
  main();
}
