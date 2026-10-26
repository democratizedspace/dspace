import { describe, expect, it } from 'vitest';
import {
  checkRepository,
  validateChangelogReleaseLines,
} from '../scripts/check-changelog-release-lines.mjs';

const fixture = () => ({
  manifest: {
    releases: { '4.2.0': '20270115.md' } as Record<string, string>,
    legacyFiles: ['20221003.md'],
  },
  files: {
    '20221003.md': 'Old unversioned narrative remains valid.\n',
    '20270115.md':
      '# DSPACE v4.2.0\nRelease introduction\n\n## February 1 - DSPACE v4.2.1 (patch addendum)\nFirst patch.\n\n## March 1 - DSPACE v4.2.2 (patch addendum)\nSecond patch.\n',
  } as Record<string, string>,
});

describe('changelog release-line convention', () => {
  it('validates repository history and current v3.0.2 placement after v3.0.1', () => {
    expect(checkRepository(process.cwd())).toEqual([]);
  });

  it('accepts legacy formats and ordered patch addenda without date-format rewrites', () => {
    const { manifest, files } = fixture();
    expect(validateChangelogReleaseLines(manifest, files, '4.2.2')).toEqual([]);
  });

  it('ignores fenced examples and prose references to other versions', () => {
    const { manifest, files } = fixture();
    files['20270115.md'] +=
      '\nSee v9.0.1 for an example.\n```md\n## DSPACE v9.0.1\n```\n';
    expect(validateChangelogReleaseLines(manifest, files, '4.2.2')).toEqual([]);
  });

  it.each(['4.3.0', '5.0.0'])(
    'allows a new major/minor %s in its own date file',
    (version) => {
      const { manifest, files } = fixture();
      manifest.releases[version] = '20270401.md';
      files['20270401.md'] = `## DSPACE v${version}\nNew release.\n`;
      expect(validateChangelogReleaseLines(manifest, files, version)).toEqual(
        []
      );
    }
  );

  it.each([
    ' ```md\n## DSPACE v9.0.1\n ```',
    '   ~~~~md\n## DSPACE v9.0.1\n   ~~~~~',
    '````md\n```\n## DSPACE v9.0.1\n````',
  ])('ignores valid indented and longer fences: %s', (example) => {
    const { manifest, files } = fixture();
    files['20270115.md'] += `\n${example}\n`;
    expect(validateChangelogReleaseLines(manifest, files, '4.2.2')).toEqual([]);
  });

  it.each([
    [
      'misplaced indented patch heading',
      (f) => {
        f.files['20221003.md'] += '\n   ## DSPACE v4.2.3\n';
      },
    ],
    [
      'new legacy bypass',
      (f) => {
        f.manifest.legacyFiles.push('20270201.md');
        f.files['20270201.md'] = 'Unversioned new release';
      },
    ],
    [
      'missing major/minor heading',
      (f) => {
        f.manifest.releases['4.3.0'] = '20270401.md';
        f.files['20270401.md'] = '';
      },
    ],
    [
      'missing patch predecessor',
      (f) => {
        f.files['20270115.md'] = '# DSPACE v4.2.0\n## DSPACE v4.2.2\n';
      },
    ],
    [
      'unmapped new file',
      (f) => {
        f.files['20270201.md'] = 'Unregistered release';
      },
    ],
    [
      'separate patch file',
      (f) => {
        f.manifest.releases['4.2.2'] = '20270301.md';
        f.files['20270301.md'] = '## DSPACE v4.2.2';
      },
    ],
    [
      'shared major/minor file',
      (f) => {
        f.manifest.releases['4.3.0'] = '20270115.md';
      },
    ],
    [
      'invalid calendar date',
      (f) => {
        f.manifest.releases['5.0.0'] = '20270230.md';
        f.files['20270230.md'] = '## DSPACE v5.0.0';
      },
    ],
    [
      'missing mapped file',
      (f) => {
        delete f.files['20270115.md'];
      },
    ],
    [
      'duplicate patch section',
      (f) => {
        f.files['20270115.md'] += '\n## DSPACE v4.2.2\n';
      },
    ],
    [
      'patch in another release line',
      (f) => {
        f.manifest.releases['5.0.0'] = '20270401.md';
        f.files['20270401.md'] = '## DSPACE v4.2.3\n';
      },
    ],
    [
      'patch in a legacy exception',
      (f) => {
        f.files['20221003.md'] += '\n## DSPACE v4.2.3\n';
      },
    ],
    [
      'patch inserted before its predecessor',
      (f) => {
        f.files['20270115.md'] = f.files['20270115.md'].replace(
          '4.2.1',
          '4.2.9'
        );
      },
    ],
    [
      'missing current patch',
      (f) => {
        f.files['20270115.md'] = 'Release introduction\n## DSPACE v4.2.1\n';
      },
    ],
  ] as Array<[string, (f: ReturnType<typeof fixture>) => void]>)(
    'rejects %s',
    (_, mutate) => {
      const f = fixture();
      mutate(f);
      expect(
        validateChangelogReleaseLines(f.manifest, f.files, '4.2.2').length
      ).toBeGreaterThan(0);
    }
  );
});
