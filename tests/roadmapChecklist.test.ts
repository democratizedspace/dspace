import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

describe('roadmap checklist', () => {
  const roadmapPath = join(
    process.cwd(),
    'frontend',
    'src',
    'pages',
    'docs',
    'md',
    'roadmap.md'
  );

  function sectionRange(content: string, heading: string) {
    const pattern = new RegExp(`##\\s+${heading}\\n`, 'g');
    const match = pattern.exec(content);
    if (!match) {
      return null;
    }
    const start = match.index + match[0].length;
    const nextHeadingMatch = content.slice(start).search(/\n##\s+/);
    const end = nextHeadingMatch === -1 ? content.length : start + nextHeadingMatch;
    return { start, end };
  }

  it('keeps unchecked roadmap items limited to future sections', () => {
    const roadmap = readFileSync(roadmapPath, 'utf8');
    const unchecked = Array.from(roadmap.matchAll(/^\s*- \[ \] .+$/gm));
    const allowedRanges = [
      sectionRange(roadmap, '2026'),
      sectionRange(roadmap, '2027 and beyond'),
    ].filter(Boolean) as Array<{ start: number; end: number }>;

    const uncheckedOutside = unchecked.filter((match) => {
      if (typeof match.index !== 'number') {
        return true;
      }
      return !allowedRanges.some((range) => match.index >= range.start && match.index <= range.end);
    });

    expect(
      uncheckedOutside,
      uncheckedOutside.length
        ? `Roadmap has unchecked items outside 2026+: ${uncheckedOutside
            .map((match) => match[0])
            .join('; ')}`
        : 'Roadmap should only list unchecked items in future sections'
    ).toHaveLength(0);
  });
});
