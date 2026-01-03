import { readFileSync } from 'node:fs';
import path from 'node:path';
import { globSync } from 'glob';
import { parse } from 'yaml';

const DOCS_MD_DIR = path.join(
  process.cwd(),
  'frontend',
  'src',
  'pages',
  'docs',
  'md'
);
export const SEARCH_METADATA_PATH = path.join(
  process.cwd(),
  'frontend',
  'src',
  'pages',
  'docs',
  'json',
  'searchMetadata.json'
);

const FEATURE_DETECTORS = {
  link: (content) =>
    /\[[^\]]+\]\([^)]+\)/.test(content) || /<a\s+[^>]*href=/i.test(content),
  image: (content) =>
    /!\[[^\]]*\]\([^)]+\)/.test(content) || /<img\s[^>]*src=/i.test(content),
  list: (content) => /^\s*(?:[-*+]\s+|\d+\.\s+)/m.test(content),
  code: (content) => /```/.test(content) || /<code>/.test(content),
  table: (content) => /^\s*\|.+\|\s*\n\s*\|?\s*:?-{2,}/m.test(content),
};

const normalizeHref = (href = '') => href.toLowerCase().replace(/\/+$/, '');

const readFrontmatter = (content) => {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    return {};
  }
  return parse(match[1]) ?? {};
};

const stripFrontmatter = (content) =>
  content.replace(/^---[\s\S]*?---\r?\n/, '');

const detectFeatures = (content) => {
  const body = stripFrontmatter(content);
  return Object.entries(FEATURE_DETECTORS)
    .filter(([, detector]) => detector(body))
    .map(([feature]) => feature)
    .sort();
};

export const collectDocsSearchMetadata = () => {
  const docFiles = globSync(path.join(DOCS_MD_DIR, '*.md'));

  const entries = docFiles.map((filePath) => {
    const content = readFileSync(filePath, 'utf8');
    const frontmatter = readFrontmatter(content);
    const slug =
      typeof frontmatter.slug === 'string' ? frontmatter.slug.trim() : '';

    if (!slug) {
      throw new Error(
        `Doc ${filePath} is missing a slug; cannot build search metadata`
      );
    }

    const href = normalizeHref(`/docs/${slug}`);

    return [href, { features: detectFeatures(content) }];
  });

  return Object.fromEntries(entries.sort(([a], [b]) => a.localeCompare(b)));
};

export const docsSearchMetadataPaths = {
  docsDirectory: DOCS_MD_DIR,
  outputPath: SEARCH_METADATA_PATH,
};
