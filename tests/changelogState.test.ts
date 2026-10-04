import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import yaml from 'yaml';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getChangelogStatus,
  partitionChangelogs,
} from '../frontend/src/utils/changelogState.mjs';
import {
  appendChangelogNotes,
  getChangelogNotes,
} from '../frontend/src/utils/changelogNotes';

const root = path.resolve(__dirname, '..');
const directory = path.join(root, 'frontend/src/pages/docs/md/changelog');
const readEntry = (filename: string) => {
  const raw = fs
    .readFileSync(path.join(directory, filename), 'utf8')
    .replace(/\r\n/g, '\n');
  const frontmatter = yaml.parse(raw.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '');
  return {
    frontmatter,
    raw,
    body: raw.replace(/^---[\s\S]*?---\s*/, '').trim(),
  };
};

afterEach(() => vi.useRealTimers());

describe('explicit changelog publication state', () => {
  it.each([undefined, null, '', 'Published', 'archived', true])(
    'rejects missing or invalid state %s',
    (status) => {
      expect(() => getChangelogStatus({ slug: '20261101', status })).toThrow(
        'status: draft or published'
      );
    }
  );

  it('does not publish a past draft or hide an explicitly published future date', () => {
    const entries = [
      { frontmatter: { slug: '20200101', status: 'draft' } },
      { frontmatter: { slug: '20990101', status: 'published' } },
    ];
    vi.useFakeTimers();
    for (const date of ['2019-01-01', '2026-11-02', '2100-01-01']) {
      vi.setSystemTime(new Date(date));
      const groups = partitionChangelogs(entries);
      expect(groups.draft).toEqual([entries[0]]);
      expect(groups.published).toEqual([entries[1]]);
    }
  });

  it('changes groups only when publication state is explicitly changed', () => {
    const entry = { frontmatter: { slug: '20261101', status: 'draft' } };
    expect(partitionChangelogs([entry]).published).toEqual([]);
    entry.frontmatter.status = 'published';
    expect(partitionChangelogs([entry]).published).toEqual([entry]);
  });

  it('requires valid state even for entries excluded from a published view', () => {
    expect(() =>
      partitionChangelogs([{ frontmatter: { slug: '20200101' } }])
    ).toThrow();
  });
});

describe('the renamed v3.1.0 draft', () => {
  it('has one canonical November draft and no obsolete duplicate or preparation page', () => {
    const entries = fs
      .readdirSync(directory)
      .filter((name) => name.endsWith('.md'))
      .map(readEntry);
    const groups = partitionChangelogs(entries);
    expect(groups.draft.map((entry) => entry.frontmatter.slug)).toEqual([
      '20261101',
    ]);
    expect(groups.published).toHaveLength(13);
    expect(groups.published[0].frontmatter.slug).toBe('20260401');
    const draft = groups.draft[0];
    expect(draft.frontmatter.title).toBe('November 1, 2026');
    expect(draft.raw).toContain(
      'unpublished draft release notes for DSPACE v3.1.0'
    );
    expect(draft.raw).toContain('tentatively planned');
    expect(draft.raw).not.toContain('3.1.2');
    expect(fs.existsSync(path.join(directory, '20260801.md'))).toBe(false);
    expect(
      fs.existsSync(
        path.join(
          root,
          'frontend/src/pages/docs/md/v3-1-release-preparation.md'
        )
      )
    ).toBe(false);
    expect(getChangelogNotes('20260801')).toEqual([]);
    expect(appendChangelogNotes('<p>Draft</p>', '20261101')).toBe(
      '<p>Draft</p>'
    );
  });

  it('does not classify either draft date as preserved published narrative', () => {
    for (const name of [
      'changelogSnapshots.json',
      'changelogSnapshotHashes.json',
    ]) {
      const fixture = JSON.parse(
        fs.readFileSync(
          path.join(root, 'frontend/tests/fixtures', name),
          'utf8'
        )
      );
      expect(fixture).not.toHaveProperty('20260801');
      expect(fixture).not.toHaveProperty('20261101');
    }
  });

  it('preserves the published April body including the v3.0.1 patch addendum', () => {
    const april = readEntry('20260401.md');
    expect(april.frontmatter.status).toBe('published');
    expect(april.body).toContain('May 21, 2026');
    expect(april.body).toContain('v3.0.1');
    // Verified published body before renaming the unpublished draft; newline-normalized.
    expect(createHash('sha256').update(april.body).digest('hex')).toBe(
      'b335421e594b5edfa07652c8fed9a2eb73381003d4ef9d63291e3efa0dc502be'
    );
  });

  it('keeps active internal references on the canonical draft', () => {
    for (const relative of [
      'frontend/src/pages/docs/md/changelog.md',
      'frontend/src/pages/docs/md/roadmap.md',
      'docs/design/token-place-chat-v3.1.md',
      'docs/design/observability-v3.1.md',
      'docs/qa/v3.1.md',
    ]) {
      const text = fs.readFileSync(path.join(root, relative), 'utf8');
      expect(text).toContain('20261101');
      expect(text).not.toContain('v3-1-release-preparation');
      expect(text).not.toContain('/docs/changelog/20260801');
    }
  });
});
