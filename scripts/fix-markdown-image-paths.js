const fs = require('fs');
const path = require('path');

const dir = path.join(
  __dirname,
  '..',
  'frontend',
  'src',
  'pages',
  'docs',
  'md',
  'changelog'
);
const changed = [];

function walk(folder) {
  for (const entry of fs.readdirSync(folder)) {
    const p = path.join(folder, entry);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) walk(p);
    else if (entry.endsWith('.md')) fixFile(p);
  }
}

function fixFile(file) {
  let data = fs.readFileSync(file, 'utf8');
  const orig = data;

  data = data.replace(
    /!\[([^\]]*)\]\(\/assets\/([^\)]+)\)/g,
    (_m, alt, rest) => `![${alt}](../../../../../public/assets/${rest})`
  );

  data = data.replace(/【\d+†Image: ([^】]+)】/g, '<!-- image removed: $1 -->');

  data = data.replace(
    /^---\r?\n([\s\S]*?)\r?\n---[\r\n]*/,
    (_m, body) => `---\n${body}\n---\n\n`
  );

  if (data !== orig) {
    fs.writeFileSync(file, data);
    changed.push(path.relative(process.cwd(), file));
  }
}

function main() {
  walk(dir);
  if (changed.length) {
    console.log('Updated files:');
    for (const f of changed) console.log(' - ' + f);
  } else {
    console.log('No changes found.');
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixFile, walk, main };
