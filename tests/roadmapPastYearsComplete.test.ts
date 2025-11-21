import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const roadmapPath = join(
  process.cwd(),
  'frontend',
  'src',
  'pages',
  'docs',
  'md',
  'roadmap.md'
);

const currentYear = new Date().getFullYear();

function sectionForYear(content: string, year: number) {
  const pattern = new RegExp(`##\\s+${year}\\n([\\s\\S]*?)(?=\\n##\\s+\\d{4}|$)`);
  const match = content.match(pattern);
  return match ? match[1] : '';
}

describe('roadmap historical commitments', () => {
  it('has no unchecked roadmap items for past years', () => {
    const content = readFileSync(roadmapPath, 'utf8');

    for (let year = 2022; year < currentYear; year += 1) {
      const section = sectionForYear(content, year);
      if (section) {
        expect(section).not.toMatch(/-\s+\[ \]/);
      }
    }
  });
});
