import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

interface AllowlistEntry {
    reason: string;
}

const CHANGELOG_DIR = path.join(__dirname, '../src/pages/docs/md/changelog');
const SNAPSHOT_PATH = path.join(__dirname, './fixtures/changelogSnapshots.json');
const ALLOWLIST_PATH = path.join(__dirname, './fixtures/changelogAllowlist.json');
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
    const allowedSlugs = new Set(
        String(process.env.ALLOW_CHANGELOG_BODY_CHANGES || '')
            .split(',')
            .map((slug) => slug.trim())
            .filter(Boolean)
    );

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
                'If the change is intentional, add an allowlist entry in frontend/tests/fixtures/changelogAllowlist.json',
                'and rerun tests with ALLOW_CHANGELOG_BODY_CHANGES set to the affected changelog (e.g., 20221031).',
                'Remember to remove the allowlist entry once the fix ships.',
            ].join('\n');

            throw new Error(guidance);
        });
    }
});
