import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

interface AllowlistEntry {
    reason: string;
}

interface CorrectionEntry {
    type: 'spelling' | 'whitespace' | 'link' | 'formatting';
    description: string;
    date: string;
}

const CHANGELOG_DIR = path.join(__dirname, '../src/pages/docs/md/changelog');
const SNAPSHOT_PATH = path.join(__dirname, './fixtures/changelogSnapshots.json');
const ALLOWLIST_PATH = path.join(__dirname, './fixtures/changelogAllowlist.json');
const CORRECTIONS_PATH = path.join(__dirname, './fixtures/changelogCorrections.json');
const LATEST_FILE = '20251101';

function readChangelogBody(filePath: string): string {
    const raw = fs.readFileSync(filePath, 'utf8');
    const withoutFrontmatter = raw.replace(/^---[\s\S]*?---\s*/, '');
    return withoutFrontmatter.trim();
}

describe('Historical changelog guard', () => {
    const snapshots = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8')) as Record<string, string>;
    const allowlist = JSON.parse(fs.readFileSync(ALLOWLIST_PATH, 'utf8')) as Record<
        string,
        AllowlistEntry
    >;
    const corrections = JSON.parse(fs.readFileSync(CORRECTIONS_PATH, 'utf8')) as Record<
        string,
        CorrectionEntry[]
    >;
    const allowedSlugs = new Set(
        String(process.env.ALLOW_CHANGELOG_BODY_CHANGES || '')
            .split(',')
            .map((slug) => slug.trim())
            .filter(Boolean)
    );

    it('validates corrections metadata format', () => {
        for (const entries of Object.values(corrections)) {
            expect(Array.isArray(entries)).toBe(true);
            for (const entry of entries) {
                expect(['spelling', 'whitespace', 'link', 'formatting']).toContain(entry.type);
                expect(typeof entry.description).toBe('string');
                expect(entry.description.trim().length).toBeGreaterThan(0);
                expect(typeof entry.date).toBe('string');
                expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            }
        }
    });

    for (const [basename, canonicalBody] of Object.entries(snapshots)) {
        if (basename === LATEST_FILE) {
            continue;
        }

        const filePath = path.join(CHANGELOG_DIR, `${basename}.md`);
        const hasFile = fs.existsSync(filePath);

        it(`${basename} matches the preserved body`, () => {
            expect(hasFile).toBe(true);
            if (!hasFile) {
                return;
            }

            const currentBody = readChangelogBody(filePath);

            if (currentBody === canonicalBody) {
                if (allowlist[basename]) {
                    throw new Error(
                        `Remove ${basename} from changelog allowlist once the change is merged; body matches the preserved snapshot.`
                    );
                }
                expect(currentBody).toBe(canonicalBody);
                return;
            }

            const allowEntry = allowlist[basename];
            const isAllowed = Boolean(allowEntry) && allowedSlugs.has(basename);

            if (isAllowed) {
                expect(typeof allowEntry.reason).toBe('string');
                expect(allowEntry.reason.trim().length).toBeGreaterThan(0);
                return;
            }

            const guidance = [
                `Changelog ${basename} changed outside the preserved snapshot.`,
                'Retain historical entries verbatim unless fixing typos or broken links.',
                '',
                'For temporary changes (work in progress):',
                '  1. Add an allowlist entry in frontend/tests/fixtures/changelogAllowlist.json',
                '  2. Rerun tests with ALLOW_CHANGELOG_BODY_CHANGES set to the affected changelog (e.g., 20221031)',
                '  3. Remove the allowlist entry once the fix ships',
                '',
                'For permanent corrections (spelling, whitespace, broken links):',
                '  1. Make the correction to the changelog file',
                '  2. Update the snapshot in frontend/tests/fixtures/changelogSnapshots.json',
                '  3. Document the change in frontend/tests/fixtures/changelogCorrections.json',
            ].join('\n');

            throw new Error(guidance);
        });
    }
});
