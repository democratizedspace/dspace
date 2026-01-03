import fs from 'node:fs';
import path from 'node:path';
import { globSync } from 'glob';
import { parse } from 'yaml';

const DOCS_MD_DIR = path.join(process.cwd(), 'frontend', 'src', 'pages', 'docs', 'md');
const SECTIONS_PATH = path.join(
    process.cwd(),
    'frontend',
    'src',
    'pages',
    'docs',
    'json',
    'sections.json'
);
const OUTPUT_PATH = path.join(
    process.cwd(),
    'frontend',
    'src',
    'pages',
    'docs',
    'json',
    'docSearchFeatures.json'
);

const FEATURE_KEYS = ['link', 'image'];

function readFrontmatterSlug(content) {
    const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);

    if (!frontmatterMatch) return null;

    const frontmatter = parse(frontmatterMatch[1]);
    const slug = typeof frontmatter.slug === 'string' ? frontmatter.slug.trim() : '';

    return slug.length > 0 ? slug : null;
}

function extractSlugFromHref(href) {
    const normalized = href.split('#')[0].replace(/\/+$|\/$/g, '');

    if (!normalized.startsWith('/docs')) return null;

    const [, , slug] = normalized.split('/');

    return slug ?? null;
}

function readDocFeatureMap() {
    const featureMap = new Map();

    globSync(path.join(DOCS_MD_DIR, '**/*.md')).forEach((filePath) => {
        const content = fs.readFileSync(filePath, 'utf8');
        const slug = readFrontmatterSlug(content) ?? path.basename(filePath, '.md');
        const body = content.replace(/^---[\s\S]*?---\r?\n/, '');

        const flags = {
            link: /\[[^\]]+\]\([^\)]+\)/.test(body),
            image: /!\[[^\]]*\]\([^\)]+\)|<img\s/i.test(body),
        };

        featureMap.set(slug.toLowerCase(), flags);
    });

    return featureMap;
}

function buildFeatureList(flags) {
    return FEATURE_KEYS.filter((key) => flags[key]);
}

function main() {
    const sections = JSON.parse(fs.readFileSync(SECTIONS_PATH, 'utf8'));
    const docFeatures = readDocFeatureMap();
    const featureIndex = [];
    const seenHref = new Set();

    sections.forEach((section) => {
        section.links?.forEach((link) => {
            const href = link.href;

            if (!href || link.external) return;
            if (seenHref.has(href)) return;

            const slug = extractSlugFromHref(href);

            if (!slug) return;

            const flags = docFeatures.get(slug.toLowerCase());

            if (!flags) {
                throw new Error(`Missing markdown entry for docs href: ${href}`);
            }

            featureIndex.push({ href, features: buildFeatureList(flags) });
            seenHref.add(href);
        });
    });

    featureIndex.sort((a, b) => a.href.localeCompare(b.href));

    fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(featureIndex, null, 4)}\n`);
    console.log(`Wrote ${featureIndex.length} feature entries to ${OUTPUT_PATH}`);
}

main();
