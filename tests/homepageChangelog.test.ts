import { afterEach, describe, expect, it, vi } from 'vitest';
import { getLatestChangelog } from '../frontend/src/utils/changelogState.mjs';
import { isStagingEnvironment } from '../frontend/src/utils/cheatsAvailability';

const published = { frontmatter: { slug: '20260401', status: 'published' } };
const draft = { frontmatter: { slug: '20261101', status: 'draft' } };
const olderDraft = { frontmatter: { slug: '20260801', status: 'draft' } };
const entries = [olderDraft, published, draft];

afterEach(() => vi.unstubAllEnvs());

describe('homepage changelog selection', () => {
  it('reads the runtime environment on each selection and fails closed when missing', () => {
    for (const [environment, expected] of [
      ['staging', draft],
      ['production', published],
      [undefined, published],
    ] as const) {
      vi.stubEnv('DSPACE_ENV', environment);
      expect(getLatestChangelog(entries, isStagingEnvironment())).toBe(
        expected
      );
    }
  });
  it.each(['staging', '  StAgInG  '])(
    'previews the newest draft in %s',
    (environment) => {
      expect(
        getLatestChangelog(entries, isStagingEnvironment(environment))
      ).toBe(draft);
      expect(draft.frontmatter.status).toBe('draft');
      expect(entries).toEqual([olderDraft, published, draft]);
    }
  );

  it.each([
    'production',
    'prod',
    'dev',
    'development',
    'unknown',
    '',
    'preview',
  ])('never selects a draft outside explicit staging (%s)', (environment) => {
    expect(getLatestChangelog(entries, isStagingEnvironment(environment))).toBe(
      published
    );
  });

  it('defaults to published releases when preview is not explicitly enabled', () => {
    expect(getLatestChangelog(entries)).toBe(published);
    expect(getLatestChangelog(entries, 'true')).toBe(published);
  });

  it('falls back to the newest published release when staging has no drafts', () => {
    const older = { frontmatter: { slug: '20230101', status: 'published' } };
    expect(getLatestChangelog([older, published], true)).toBe(published);
  });

  it('handles empty and draft-only histories without leaking drafts', () => {
    expect(getLatestChangelog([])).toBeUndefined();
    expect(getLatestChangelog([], true)).toBeUndefined();
    expect(getLatestChangelog([draft])).toBeUndefined();
    expect(getLatestChangelog([draft], true)).toBe(draft);
  });

  it('still rejects invalid publication state', () => {
    expect(() =>
      getLatestChangelog([{ frontmatter: { slug: '20261101' } }], true)
    ).toThrow('status: draft or published');
  });
});
