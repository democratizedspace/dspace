import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const qaRoot = join(process.cwd(), 'frontend', 'src', 'pages', 'docs', 'md');

describe('docs backup guidance alignment', () => {
    it('Cloud Sync doc matches Settings flow and storage behavior', () => {
        const content = readFileSync(join(qaRoot, 'cloud-sync.md'), 'utf8');

        expect(content).toMatch(/GitHub personal access token/i);
        expect(content).toMatch(/gist id/i);
        expect(content).toMatch(/Settings/);
        expect(content).toMatch(/Log out/i);
    });

    it('Backups doc describes export formats and covered payload keys', () => {
        const content = readFileSync(join(qaRoot, 'backups.md'), 'utf8');

        expect(content).toMatch(/Base64-encoded JSON/i);
        expect(content).toMatch(/quests.*inventory.*processes/i);
        expect(content).toMatch(/Custom Content Backup/i);
        expect(content).toMatch(/items.*processes.*quests/i);
    });
});
