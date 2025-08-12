const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'docs', 'md', 'changelog');
const unreleasedPath = path.join(__dirname, '..', 'frontend', 'changelog', 'unreleased.md');
const outPath = path.join(__dirname, '..', 'frontend', 'CHANGELOG.md');

function getReleaseEntries() {
  const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.md'));
  files.sort().reverse();
  return files.map(f => {
    const full = path.join(docsDir, f);
    const content = fs.readFileSync(full, 'utf8');
    const titleMatch = content.match(/title:\s*['"]([^'"\n]+)['"]/);
    const title = titleMatch ? titleMatch[1] : f.replace('.md', '');
    const relPath = path.join('src', 'pages', 'docs', 'md', 'changelog', f).replace(/\\/g, '/');
    return { title, relPath };
  });
}

function buildChangelog() {
  const unreleased = fs.existsSync(unreleasedPath)
    ? fs.readFileSync(unreleasedPath, 'utf8').trim()
    : '';
  const releases = getReleaseEntries();
  let md = '# Changelog\n\n';
  if (unreleased) {
    md += '## Unreleased\n\n' + unreleased + '\n\n';
  }
  md += '## Releases\n\n';
  releases.forEach(r => {
    md += `- [${r.title}](${r.relPath})\n`;
  });
  fs.writeFileSync(outPath, md);
  return md;
}

function main() {
  buildChangelog();
  console.log('Generated changelog index at', outPath);
}

if (require.main === module) {
  main();
}

module.exports = { buildChangelog };
