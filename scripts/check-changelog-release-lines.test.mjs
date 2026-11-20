import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { createRequire } from 'node:module';
import {
  checkRepository,
  validateChangelogReleaseLines,
} from './check-changelog-release-lines.mjs';
import {
  getLatestChangelog,
  partitionChangelogs,
} from '../frontend/src/utils/changelogState.mjs';

const { parse } = createRequire(import.meta.url)('yaml');
const root = fileURLToPath(new URL('../', import.meta.url));
const entry = (slug, body, status = 'draft', tagline = '') =>
  `---\nstatus: ${status}\nslug: '${slug}'\ntagline: '${tagline}'\n---\n${body}\n`;
const fixture = () => ({
  manifest: {
    releases: { '4.2.0': '20270115.md' },
    legacyFiles: ['20221003.md'],
  },
  files: {
    '20221003.md': entry('20221003', 'Preserved old prose.', 'published'),
    '20270115.md': entry(
      '20270115',
      '# DSPACE v4.2.0\n## v4.2.1\nPatch one.\n## v4.2.2\nPatch two.'
    ),
  },
  version: '4.2.2',
});
const errors = (f) =>
  validateChangelogReleaseLines(f.manifest, f.files, f.version);

test('repository release lines and CLI pass without modifying any entries', () => {
  assert.deepEqual(checkRepository(root), []);
  assert.match(
    execFileSync(
      process.execPath,
      ['scripts/check-changelog-release-lines.mjs'],
      { cwd: root, encoding: 'utf8' }
    ),
    /explicit lifecycle passed/
  );
});

test('ordered patch addenda may be planned in the published line without changing state', () => {
  const f = fixture();
  f.files['20270115.md'] = f.files['20270115.md'].replace(
    'status: draft',
    'status: published'
  );
  f.files['20270115.md'] += '\n## v4.2.3 (draft patch addendum)\n';
  f.version = '4.2.3';
  const before = structuredClone(f);
  assert.deepEqual(errors(f), []);
  assert.deepEqual(f, before);
});

test('existing draft tagline is an explicit base declaration; dates never publish it', () => {
  const f = fixture();
  f.files['20270115.md'] = entry(
    '20270115',
    'Editable draft text, with incidental v9.0.0 prose.',
    'draft',
    'v4.2.0 draft: planned features'
  );
  f.version = '4.2.0';
  assert.deepEqual(errors(f), []);
  f.files['20270115.md'] = f.files['20270115.md'].replace(
    'status: draft',
    'status: published'
  );
  assert.deepEqual(errors(f), []); // Structure alone does not grant publication authority.
});

test('the actual draft remains excluded by default and available to explicit staging preview', () => {
  const load = (name) => {
    const raw = readFileSync(
      new URL(
        `../frontend/src/pages/docs/md/changelog/${name}.md`,
        import.meta.url
      ),
      'utf8'
    ).replace(/\r\n/g, '\n');
    return { frontmatter: parse(raw.match(/^---\n([\s\S]*?)\n---/)[1]) };
  };
  const published = load('20260401');
  const draft = load('20261101');
  const entries = [draft, published];
  const before = structuredClone(entries);
  assert.equal(getLatestChangelog(entries), published);
  assert.equal(getLatestChangelog(entries, true), draft);
  assert.deepEqual(partitionChangelogs(entries).draft, [draft]);
  assert.deepEqual(entries, before);
});

for (const example of [
  'See v9.0.1 in prose.',
  '```md\n## v9.0.1\n```',
  ' ```md\n## v9.0.1\n ```',
  '   ~~~~md\n## v9.0.1\n   ~~~~~',
  '````md\n```\n## v9.0.1\n````',
])
  test(`ignores prose/fenced example ${JSON.stringify(example)}`, () => {
    const f = fixture();
    f.files['20270115.md'] += `\n${example}\n`;
    assert.deepEqual(errors(f), []);
  });

for (const hidden of [
  '<!--\n## v9.0.1\n-->',
  '<!--\nv9.0.1\n------\n-->',
  '    ## v9.0.1',
  '```md\n<!--\n```\n<!-- ## v9.0.1 -->',
])
  test(`ignores non-rendered release heading ${JSON.stringify(hidden)}`, () => {
    const f = fixture();
    f.files['20270115.md'] += `\n${hidden}\n`;
    assert.deepEqual(errors(f), []);
  });

test('commented-out current patch cannot satisfy the addendum requirement', () => {
  const f = fixture();
  f.files['20270115.md'] = entry(
    '20270115',
    '# v4.2.0\n<!--\n## v4.2.1\nTODO\n-->'
  );
  f.version = '4.2.1';
  assert.ok(
    errors(f).some((error) => error.includes('current patch needs an addendum'))
  );
});

test('commented-out base cannot satisfy the base declaration requirement', () => {
  const f = fixture();
  f.files['20270115.md'] = entry('20270115', '<!--\n# v4.2.0\n-->');
  f.version = '4.2.0';
  assert.ok(errors(f).some((error) => error.includes('missing major/minor')));
});

test('inline HTML comments do not add a second release declaration', () => {
  const f = fixture();
  f.files['20270115.md'] = f.files['20270115.md'].replace(
    '## v4.2.1',
    '## v4.2.1 <!-- v9.0.1 -->'
  );
  assert.deepEqual(errors(f), []);
});

test('Setext base and current patch headings satisfy release requirements', () => {
  const f = fixture();
  f.files['20270115.md'] = entry(
    '20270115',
    'DSPACE v4.2.0\n=====\n\nv4.2.1\n------\n\nv4.2.2\n------'
  );
  assert.deepEqual(errors(f), []);
});

for (const heading of ['v9.0.1\n------', 'v4.2.2\n======'])
  test(`rejects misplaced or duplicate Setext release ${JSON.stringify(heading)}`, () => {
    const f = fixture();
    f.files['20270115.md'] += `\n${heading}\n`;
    assert.notDeepEqual(errors(f), []);
  });

for (const version of ['4.3.0', '5.0.0'])
  test(`new release ${version} gets its own mapped file`, () => {
    const f = fixture();
    f.manifest.releases[version] = '20270401.md';
    f.files['20270401.md'] = entry('20270401', `# DSPACE v${version}`);
    f.version = version;
    assert.deepEqual(errors(f), []);
  });

const negatives = [
  [
    'missing current mapping',
    (f) => {
      f.version = '5.0.0';
    },
  ],
  [
    'malformed current version',
    (f) => {
      f.version = '4.2';
    },
  ],
  [
    'missing current patch',
    (f) => {
      f.version = '4.2.3';
    },
  ],
  [
    'separate patch file',
    (f) => {
      f.manifest.releases['4.2.3'] = '20270401.md';
      f.files['20270401.md'] = entry('20270401', '## v4.2.3');
    },
  ],
  [
    'shared line file',
    (f) => {
      f.manifest.releases['5.0.0'] = '20270115.md';
    },
  ],
  [
    'missing mapped file',
    (f) => {
      delete f.files['20270115.md'];
    },
  ],
  [
    'unmapped file',
    (f) => {
      f.files['20270401.md'] = entry('20270401', '## v5.0.0');
    },
  ],
  [
    'invalid date',
    (f) => {
      f.manifest.releases['5.0.0'] = '20270230.md';
      f.files['20270230.md'] = entry('20270230', '## v5.0.0');
    },
  ],
  [
    'new legacy bypass',
    (f) => {
      f.manifest.legacyFiles.push('20270401.md');
      f.files['20270401.md'] = entry('20270401', 'Unmapped');
    },
  ],
  [
    'duplicate legacy exception',
    (f) => {
      f.manifest.legacyFiles.push('20221003.md');
    },
  ],
  [
    'legacy mapped as release',
    (f) => {
      f.manifest.releases['5.0.0'] = '20221003.md';
    },
  ],
  [
    'published legacy gains misplaced release section',
    (f) => {
      f.files['20221003.md'] += '\n   ## v4.2.3\n';
    },
  ],
  [
    'missing predecessor',
    (f) => {
      f.files['20270115.md'] = f.files['20270115.md'].replace(
        '## v4.2.1\nPatch one.\n',
        ''
      );
    },
  ],
  [
    'duplicate patch',
    (f) => {
      f.files['20270115.md'] += '\n## v4.2.2\n';
    },
  ],
  [
    'patch in another line',
    (f) => {
      f.files['20270115.md'] += '\n## v5.0.1\n';
    },
  ],
  [
    'base follows patches',
    (f) => {
      f.files['20270115.md'] =
        f.files['20270115.md'].replace('# DSPACE v4.2.0\n', '') +
        '\n## v4.2.0\n';
    },
  ],
  [
    'missing base declaration',
    (f) => {
      f.files['20270115.md'] = f.files['20270115.md'].replace(
        '# DSPACE v4.2.0\n',
        'Prose mentions v4.2.0.\n'
      );
    },
  ],
  [
    'tagline mismatches line',
    (f) => {
      f.files['20270115.md'] = f.files['20270115.md'].replace(
        "tagline: ''",
        "tagline: 'v5.0.0 draft'"
      );
    },
  ],
  [
    'tagline declares patch as base',
    (f) => {
      f.files['20270115.md'] = f.files['20270115.md'].replace(
        "tagline: ''",
        "tagline: 'v4.2.1'"
      );
    },
  ],
  [
    'slug mismatch',
    (f) => {
      f.files['20270115.md'] = f.files['20270115.md'].replace(
        "slug: '20270115'",
        "slug: '20270401'"
      );
    },
  ],
  [
    'missing status',
    (f) => {
      f.files['20270115.md'] = f.files['20270115.md'].replace(
        'status: draft\n',
        ''
      );
    },
  ],
  [
    'invalid status',
    (f) => {
      f.files['20270115.md'] = f.files['20270115.md'].replace(
        'status: draft',
        'status: scheduled'
      );
    },
  ],
  [
    'duplicate YAML status',
    (f) => {
      f.files['20270115.md'] = f.files['20270115.md'].replace(
        'status: draft',
        'status: draft\nstatus: published'
      );
    },
  ],
];
for (const [name, mutate] of negatives)
  test(`rejects ${name}`, () => {
    const f = fixture();
    mutate(f);
    assert.notDeepEqual(errors(f), []);
  });

test('CI runs the validator and regression suite without soft failure', () => {
  const workflow = parse(
    readFileSync(
      new URL('../.github/workflows/ci.yml', import.meta.url),
      'utf8'
    )
  );
  const job = workflow.jobs.build;
  const step = job.steps.find(
    (s) => s.name === 'Verify changelog release lines and regressions'
  );
  assert.deepEqual(step.run.trim().split('\n'), [
    'node scripts/check-changelog-release-lines.mjs',
    'node --test scripts/check-changelog-release-lines.test.mjs',
  ]);
  assert.equal(step['continue-on-error'], undefined);
  assert.equal(step.if, undefined);
  assert.equal(job['continue-on-error'], undefined);
});
