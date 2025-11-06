import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const PROJECT_ROOT = process.cwd();
const CHANGELOG_DIR = join(PROJECT_ROOT, 'frontend', 'src', 'pages', 'docs', 'md', 'changelog');
const FIXTURE_DIR = join(PROJECT_ROOT, 'tests', 'fixtures', 'changelog');
const ALLOW_ENV = 'ALLOW_CHANGELOG_CANONICAL_UPDATES';

const PROTECTED_CHANGELOGS = [
    '20221003',
    '20221005',
    '20221015',
    '20221019',
    '20221031',
    '20221210',
    '20230101',
    '20230105',
    '20230131',
    '20230630',
    '20230915',
];

describe('Changelog canon', () => {
    const allowOverrides = process.env[ALLOW_ENV] === '1';

    for (const slug of PROTECTED_CHANGELOGS) {
        it(`matches the canonical content for ${slug}`, () => {
            if (allowOverrides) {
                return;
            }

            const filename = `${slug}.md`;
            const docPath = join(CHANGELOG_DIR, filename);
            const fixturePath = join(FIXTURE_DIR, filename);

            const doc = readFileSync(docPath, 'utf8').trim();
            const fixture = readFileSync(fixturePath, 'utf8').trim();

            if (doc !== fixture) {
                console.error(
                    [
                        `The ${slug} changelog no longer matches its canonical release notes.`,
                        'Use the changelog notes mechanism to add follow-up context without editing the original entry.',
                        `To intentionally update the canonical text (for example, to fix a typo), rerun the tests with ${ALLOW_ENV}=1`,
                        'and update the corresponding fixture once your change is ready to merge.',
                    ].join('\n')
                );
            }

            expect(doc).toBe(fixture);
        });
    }
});
