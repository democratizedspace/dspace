import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('April 1, 2026 changelog release checklist', () => {
  const changelogPath = join(
    process.cwd(),
    'frontend',
    'src',
    'pages',
    'docs',
    'md',
    'changelog',
    '20260401.md'
  );

  const qaChecklistPath = join(process.cwd(), 'docs', 'qa', 'v3.0.1.md');

  it('drops the prerelease checklist language from the published notes', () => {
    const content = readFileSync(changelogPath, 'utf8');

    expect(content).not.toMatch(
      /This checklist will be removed before the final release/i
    );
    expect(content).not.toMatch(/\[x\]/i);
    expect(content).not.toMatch(/💯/);
  });

  it('records rc.6 SHA/range signoff with SHA-anchored evidence and explicit tag follow-up', () => {
    const content = readFileSync(qaChecklistPath, 'utf8');

    expect(content).toContain(
      '- [x] QA signoff confirms the audited commit delta above resolves to the immutable rc.6 SHA and'
    );
    expect(content).toMatch(/SHA\/range resolution gate only/i);
    expect(content).toMatch(/origin.*unavailable|no configured `origin`/i);
    expect(content).toMatch(/release-owner follow-up artifact/i);
    expect(content).toMatch(/git ls-remote --tags origin v3\.0\.1-rc\.6/i);
    expect(content).toContain('8a1fa6ca2b4206c3e481da6b8f02c912b56dfdb0');
    expect(content).toContain(
      '`3ec45a5517a35c96767f6b946c01104e6ec88f93..8a1fa6ca2b4206c3e481da6b8f02c912b56dfdb0`'
    );
    expect(content).toMatch(
      /Completed custom quests move into the Completed Quests section/
    );
    expect(content).toContain('`/settings` responsive layout');
    expect(content).toContain('QuestChat readiness/status behavior');
  });

  it('publishes the v3.0.1 reader guide in the changelog body', () => {
    const content = readFileSync(changelogPath, 'utf8');

    expect(content).toContain(
      '## June 1, 2026 — DSPACE v3.0.1 (patch addendum)'
    );
    expect(content).toContain('### Reader guide and verification routes');
    expect(content).toContain('The player-visible route checks for v3.0.1');
    expect(content).toContain(
      'completed custom quests into the Completed Quests section'
    );
    expect(content).toContain('stabilized QuestChat readiness/status behavior');
    expect(content).toContain('responsive `/settings` layout');
  });
});
