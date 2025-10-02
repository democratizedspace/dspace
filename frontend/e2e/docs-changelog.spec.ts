import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const changelogDir = path.resolve(__dirname, '../src/pages/docs/md/changelog');

const parseFrontmatter = (frontmatter) => {
    const result = {};
    const lines = frontmatter.split('\n');
    let currentKey = null;
    let blockLines = [];

    const commitBlock = () => {
        if (currentKey) {
            result[currentKey] = blockLines.join('\n').trim();
        }
        currentKey = null;
        blockLines = [];
    };

    for (const line of lines) {
        if (currentKey) {
            if (/^\s/.test(line)) {
                blockLines.push(line.trim());
                continue;
            }

            if (!line.trim()) {
                blockLines.push('');
                continue;
            }

            commitBlock();
        }

        if (!line.trim()) {
            continue;
        }

        const separatorIndex = line.indexOf(':');
        if (separatorIndex === -1) {
            continue;
        }

        const key = line.slice(0, separatorIndex).trim();
        let value = line.slice(separatorIndex + 1).trim();

        if (value === '>-') {
            currentKey = key;
            blockLines = [];
            continue;
        }

        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }

        result[key] = value;
    }

    if (currentKey) {
        commitBlock();
    }

    return result;
};

const getLatestChangelogMeta = () => {
    const files = fs.readdirSync(changelogDir).filter((file) => file.endsWith('.md'));

    const entries = files
        .map((file) => {
            const raw = fs.readFileSync(path.join(changelogDir, file), 'utf8');
            const match = raw.match(/^---\n([\s\S]+?)\n---/);
            if (!match) {
                return null;
            }
            const frontmatter = parseFrontmatter(match[1]);
            if (!frontmatter.slug) {
                return null;
            }
            return frontmatter;
        })
        .filter(Boolean)
        .sort((a, b) => String(b.slug).localeCompare(String(a.slug)));

    return entries[0] ?? null;
};

const latestChangelog = getLatestChangelogMeta();

// The changelog doc should render real release notes instead of the placeholder CTA.
test.describe('docs changelog page', () => {
    test('lists recent release entries', async ({ page }) => {
        await page.goto('/docs/changelog');
        await page.waitForLoadState('domcontentloaded');

        await expect(page.getByRole('heading', { name: 'Changelog' })).toBeVisible();

        const releasesList = page.getByRole('list', { name: 'Release entries' });
        await expect(releasesList).toBeVisible();

        if (latestChangelog) {
            const expectedLinkText = latestChangelog.tagline
                ? `${latestChangelog.title} — ${latestChangelog.tagline}`
                : latestChangelog.title;

            const latestLink = releasesList.getByRole('link', {
                name: expectedLinkText,
            });

            await expect(latestLink).toBeVisible();
            await expect(latestLink).toHaveAttribute(
                'href',
                `/docs/changelog/${latestChangelog.slug}`
            );

            const summaryText = latestChangelog.summary
                ? latestChangelog.summary.replace(/\s+/g, ' ').trim()
                : '';

            if (summaryText) {
                await expect(
                    releasesList.getByText(summaryText, {
                        exact: true,
                    })
                ).toBeVisible();
            }
        }

        await expect(
            page.getByRole('link', { name: 'complete changelog archive' })
        ).toHaveAttribute('href', '/changelog');
    });
});
