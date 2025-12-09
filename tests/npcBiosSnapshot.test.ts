import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

type NpcSection = {
  name: string;
  dialogues: string[];
};

function parseNpcSections(markdown: string): NpcSection[] {
  const sections: NpcSection[] = [];
  const lines = markdown.split('\n');
  let current: { name: string; lines: string[] } | null = null;

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.*)$/);
    if (headingMatch) {
      if (current) {
        sections.push({
          name: current.name,
          dialogues: extractDialogues(current.lines),
        });
      }
      current = { name: headingMatch[1].trim(), lines: [] };
      continue;
    }

    if (current) {
      current.lines.push(line);
    }
  }

  if (current) {
    sections.push({ name: current.name, dialogues: extractDialogues(current.lines) });
  }

  return sections;
}

function extractDialogues(lines: string[]): string[] {
  const dialogues: string[] = [];
  let inSampleSection = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (/^###\s+Sample Dialogue/i.test(line)) {
      inSampleSection = true;
      continue;
    }

    if (!inSampleSection) {
      continue;
    }

    const match = line.match(/^-\s+(.*)$/);
    if (match) {
      dialogues.push(match[1].trim());
    }
  }

  return dialogues;
}

describe('NPC bios', () => {
  const npcDocPath = join(
    process.cwd(),
    'frontend',
    'src',
    'pages',
    'docs',
    'md',
    'npcs.md'
  );

  const content = readFileSync(npcDocPath, 'utf8');
  const sections = parseNpcSections(content);
  const npcSections = sections.filter((section) => section.dialogues.length > 0);

  it('includes sample dialogue for every NPC section', () => {
    const missingDialogues = sections
      .filter((section) => section.name !== 'AI-enabled NPC chat' && section.dialogues.length === 0)
      .map((section) => section.name);

    expect(missingDialogues).toEqual([]);
    npcSections.forEach((section) => {
      expect(section.dialogues.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('matches the curated NPC dialogue snapshot', () => {
    const dialoguesByNpc = Object.fromEntries(
      npcSections.map((section) => [section.name, section.dialogues])
    );

    expect(dialoguesByNpc).toMatchSnapshot();
  });
});
