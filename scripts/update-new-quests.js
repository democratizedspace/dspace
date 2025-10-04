const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const frontendOutput = path.join(
  __dirname,
  '..',
  'frontend',
  'src',
  'pages',
  'docs',
  'md',
  'new-quests.md'
);
const docsOutput = path.join(__dirname, '..', 'docs', 'new-quests.md');

const PRE_V2_COMMIT = 'fc840def24c5140411d2892f468960acb8250681';
const V2_COMMIT = '93a834691af174b3c8b9895e9a27ce72e10e8299';
const V21_COMMIT = 'd956e807d49114da2d0ff28aacef91341813bf82';

function parseDocSections(content) {
  const lines = content.split('\n');
  const sections = [];
  let currentSection = null;
  let currentGroup = null;

  const pushGroup = () => {
    if (currentSection && currentGroup) {
      currentSection.groups.push(currentGroup);
      currentGroup = null;
    }
  };

  const pushSection = () => {
    if (currentSection) {
      pushGroup();
      if (!currentSection.newCount) {
        currentSection.newCount = currentSection.groups.reduce(
          (sum, group) => sum + group.quests.length,
          0
        );
      }
      sections.push(currentSection);
      currentSection = null;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    const sectionMatch = line.match(/^#{1,2}\s+Quests added in\s+(.+)/i);
    if (sectionMatch) {
      pushSection();
      currentSection = {
        version: sectionMatch[1].trim(),
        prevCount: 0,
        currentCount: 0,
        newCount: 0,
        groups: [],
      };
      currentGroup = null;
      continue;
    }

    if (!currentSection) continue;

    if (!line) continue;

    const prevMatch = line.match(/^Prev quest count:\s+(\d+)/i);
    if (prevMatch) {
      currentSection.prevCount = Number(prevMatch[1]);
      continue;
    }

    const currentMatch = line.match(/^Current quest count:\s+(\d+)/i);
    if (currentMatch) {
      currentSection.currentCount = Number(currentMatch[1]);
      continue;
    }

    const newMatch = line.match(/^New quests in this release:\s+(\d+)/i);
    if (newMatch) {
      currentSection.newCount = Number(newMatch[1]);
      continue;
    }

    const groupMatch = line.match(/^###\s+(.+)/);
    if (groupMatch) {
      pushGroup();
      currentGroup = { tree: groupMatch[1].trim(), quests: [] };
      continue;
    }

    if (line.startsWith('-') && currentGroup) {
      const quest = line.replace(/^-+\s*/, '').trim();
      if (quest) {
        currentGroup.quests.push(quest);
      }
    }
  }

  pushSection();
  return sections;
}

function getDocFallbackSections() {
  try {
    const content = fs.readFileSync(frontendOutput, 'utf8');
    return parseDocSections(content);
  } catch (error) {
    try {
      const content = fs.readFileSync(docsOutput, 'utf8');
      return parseDocSections(content);
    } catch {
      return [];
    }
  }
}

function listQuestFiles(ref) {
  const questDir = path.join(
    __dirname,
    '..',
    'frontend',
    'src',
    'pages',
    'quests',
    'json'
  );
  const cmd = ref
    ? `git ls-tree -r --name-only ${ref} ${questDir}`
    : `git ls-tree -r --name-only HEAD ${questDir}`;
  let output;
  try {
    output = execSync(cmd, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
  } catch {
    output = execSync(`git ls-tree -r --name-only HEAD ${questDir}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
  }
  return output.trim().split(/\n/).filter(Boolean);
}

function getQuestPathsBetween(fromRef, toRef) {
  const diff = execSync(
    `git diff --name-only --diff-filter=A ${fromRef} ${toRef} -- frontend/src/pages/quests/json`,
    { encoding: 'utf8' }
  );
  return diff
    .split('\n')
    .map((p) => p.trim())
    .filter(Boolean);
}

function groupQuests(paths) {
  const groups = {};
  for (const p of paths) {
    const parts = p.split('/');
    const tree = parts[parts.length - 2];
    const quest = parts[parts.length - 1].replace('.json', '');
    if (!groups[tree]) groups[tree] = [];
    groups[tree].push(`${tree}/${quest}`);
  }
  return Object.keys(groups)
    .sort()
    .map((tree) => ({ tree, quests: groups[tree].sort() }));
}

function computeReleaseSections() {
  const envRef = process.env.NEW_QUESTS_REF;
  let v3Ref = envRef || 'origin/v3';
  try {
    if (!envRef) {
      execSync('git fetch origin main --depth=100000', { stdio: 'ignore' });
      execSync('git fetch origin v3 --depth=100000', { stdio: 'ignore' });
    }
    execSync(`git rev-parse --verify ${v3Ref}`, { stdio: 'ignore' });
  } catch (err) {
    // fallback to local HEAD if remote or ref is unavailable
    v3Ref = 'HEAD';
  }
  const releases = [
    { version: 'v3', from: V21_COMMIT, to: v3Ref },
    { version: 'v2.1', from: V2_COMMIT, to: V21_COMMIT },
    { version: 'v2', from: PRE_V2_COMMIT, to: V2_COMMIT },
  ];
  return releases.map((r) => {
    const paths = getQuestPathsBetween(r.from, r.to);
    return {
      version: r.version,
      prevCount: listQuestFiles(r.from).length,
      currentCount: listQuestFiles(r.to).length,
      groups: groupQuests(paths),
      newCount: paths.length,
    };
  });
}

function getReleaseSections() {
  try {
    return computeReleaseSections();
  } catch (error) {
    return getDocFallbackSections();
  }
}

function generateMarkdown(sections) {
  const lines = [
    '---',
    "title: 'New Quests in v3'",
    "slug: 'new-quests'",
    '---',
    '',
    '<!-- Auto-generated by scripts/update-new-quests.js. Run `npm run new-quests:update` to refresh. -->',
    '',
  ];
  sections.forEach((section, idx) => {
    const headingPrefix = idx === 0 ? '#' : '##';
    lines.push(`${headingPrefix} Quests added in ${section.version}`);
    lines.push('');
    if (section.version === 'v3') {
      lines.push(
        'These quests exist in the `v3` branch but are not present on `main` yet.',
        'Use this list when upgrading quests or proposing follow-up content.',
        ''
      );
    }
    lines.push(
      `Prev quest count: ${section.prevCount}`,
      `Current quest count: ${section.currentCount}`,
      `New quests in this release: ${section.newCount}`,
      ''
    );
    section.groups.forEach(({ tree, quests }) => {
      lines.push(`### ${tree}`);
      lines.push('');
      quests.forEach((q) => lines.push(`-   ${q}`));
      lines.push('');
    });
  });
  if (lines[lines.length - 1] === '') {
    lines.pop();
  }
  return lines.join('\n') + '\n';
}

function main() {
  const sections = getReleaseSections();
  const content = generateMarkdown(sections);
  fs.writeFileSync(frontendOutput, content);
  fs.writeFileSync(docsOutput, content);
}

if (require.main === module) {
  main();
}

module.exports = {
  listQuestFiles,
  getQuestPathsBetween,
  groupQuests,
  getReleaseSections,
  generateMarkdown,
  main,
  PRE_V2_COMMIT,
  V2_COMMIT,
  V21_COMMIT,
};
