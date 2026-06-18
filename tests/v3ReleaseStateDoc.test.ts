import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('v3 release state doc', () => {
  const docPath = join(
    process.cwd(),
    'frontend',
    'src',
    'pages',
    'docs',
    'md',
    'v3-release-state.md'
  );

  it('mentions token.place as the v3.1 default Chat provider', () => {
    const doc = readFileSync(docPath, 'utf8');

    expect(doc).toMatch(/token\.place is the v3\.1 default Chat provider/i);
    expect(doc).toMatch(
      /Fresh users can use `\/chat` without auth or an API key/i
    );
    expect(doc).toMatch(
      /OpenAI remains available as an optional bring-your-own-key provider/i
    );
  });

  it('mentions Completionist Award III as part of v3 launch sign-off scope', () => {
    const doc = readFileSync(docPath, 'utf8');

    expect(doc).toMatch(/Completionist Award III[\s\S]*launch sign-off/i);
    expect(doc).toMatch(/assemble-completionist-award-iii/i);
    expect(doc).toMatch(/does not grant a second copy/i);
  });

  it('lists multiple v2-only mechanics removed or not applicable', () => {
    const doc = readFileSync(docPath, 'utf8');
    const sectionMatch = doc.match(
      /## v2-only mechanics removed \/ not applicable in v3\n([\s\S]*?)(\n## |\n# |$)/
    );

    expect(sectionMatch).not.toBeNull();

    const bullets = sectionMatch?.[1]?.match(/^\s*-\s+/gm) ?? [];
    expect(bullets.length).toBeGreaterThanOrEqual(3);
  });
});
