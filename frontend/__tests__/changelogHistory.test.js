const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const canonicalHashes = require('./fixtures/changelogHashes.json');

const changelogDir = path.join(__dirname, '..', 'src', 'pages', 'docs', 'md', 'changelog');

const readChangelog = (filePath) => {
    const raw = fs.readFileSync(filePath, 'utf8');

    if (!raw.startsWith('---')) {
        return { frontmatter: '', content: raw, slug: '' };
    }

    const lines = raw.split('\n');
    let closingIndex = -1;

    for (let i = 1; i < lines.length; i += 1) {
        if (lines[i].trim() === '---') {
            closingIndex = i;
            break;
        }
    }

    if (closingIndex === -1) {
        throw new Error(`Missing closing frontmatter in ${filePath}`);
    }

    const frontmatter = lines.slice(1, closingIndex).join('\n');
    const content = lines.slice(closingIndex + 1).join('\n');
    const slugMatch = frontmatter.match(/^slug:\s*["']?([A-Za-z0-9_-]+)["']?/m);
    const slug = slugMatch ? slugMatch[1] : '';

    return { frontmatter, content, slug };
};

const extractRetconException = (frontmatter) => {
    const exceptionMatch = frontmatter.match(/^retconException:\s*(.+)$/m);

    if (!exceptionMatch) {
        return '';
    }

    return exceptionMatch[1].trim();
};

const computeHash = (content) => crypto.createHash('sha256').update(content).digest('hex');

const files = fs
    .readdirSync(changelogDir)
    .filter((file) => file.endsWith('.md') && file !== '20251101.md')
    .sort();

describe('historic changelog entries', () => {
    test.each(files)('preserves release notes for %s', (fileName) => {
        const filePath = path.join(changelogDir, fileName);
        const { frontmatter, content, slug } = readChangelog(filePath);

        expect(slug).toBeTruthy();

        const exceptionReason = extractRetconException(frontmatter);

        if (exceptionReason) {
            expect(/typo|link/i.test(exceptionReason)).toBe(true);
            return;
        }

        const expectedHash = canonicalHashes[slug];

        expect(expectedHash).toBeDefined();

        const hash = computeHash(content);

        expect(hash).toBe(expectedHash);
    });
});
