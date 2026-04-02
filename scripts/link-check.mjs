#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { glob } from 'glob';
import { parse } from 'yaml';

const markdownFiles = await glob('**/*.md', {
  ignore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/coverage/**',
    '**/test-artifacts/**',
    '**/.pnpm/**'
  ],
});

const linkPattern = /\[[^\]]+\]\(([^)]+)\)/g;
const broken = [];
const githubPrefixes = [
  'https://github.com/democratizedspace/dspace/blob/main/',
  'http://github.com/democratizedspace/dspace/blob/main/',
  'https://github.com/democratizedspace/dspace/tree/main/',
  'http://github.com/democratizedspace/dspace/tree/main/',
  'https://raw.githubusercontent.com/democratizedspace/dspace/main/',
  'http://raw.githubusercontent.com/democratizedspace/dspace/main/',
];
const staleDspaceBranchPattern =
  /^https?:\/\/(?:github\.com\/democratizedspace\/dspace\/(?:blob|tree)|raw\.githubusercontent\.com\/democratizedspace\/dspace)\/v3(?:\/|$)/i;
const docsSlugSet = new Set();
const repoRoot = process.cwd();

const docsFiles = await glob('frontend/src/pages/docs/md/*.md');
for (const file of docsFiles) {
  const content = await readFile(file, 'utf8');
  const match = content.match(/^\s*---\s*([\s\S]*?)\s*---/);
  if (!match) continue;
  const frontmatter = parse(match[1]);
  const slug = String(frontmatter?.slug ?? '').trim();
  if (slug) {
    docsSlugSet.add(slug.toLowerCase());
  }
}

// Map internal routes to their Astro/Svelte file locations
function resolveInternalRoute(routePath) {
  const pagesDir = 'frontend/src/pages';
  
  // Handle root path
  if (routePath === '/') {
    return existsSync(path.join(pagesDir, 'index.astro'));
  }
  
  // Remove leading slash
  const cleanPath = routePath.replace(/^\//, '');
  
  // Remove trailing slash
  const normalizedPath = cleanPath.replace(/\/$/, '');
  
  // Check common patterns for Astro routes
  const candidates = [
    path.join(pagesDir, normalizedPath + '.astro'),
    path.join(pagesDir, normalizedPath + '.md'),
    path.join(pagesDir, normalizedPath, 'index.astro'),
    path.join(pagesDir, normalizedPath, 'index.md'),
  ];
  
  // Check if it's a dynamic route
  const parts = normalizedPath.split('/');
  if (normalizedPath.length > 0 && parts[0]) {
    const basePath = parts[0];
    
    // Check for [slug] pattern (e.g., /docs/about -> /docs/[slug].astro)
    candidates.push(path.join(pagesDir, basePath, '[slug].astro'));
    
    // Check for [id] pattern (e.g., /quests/1 -> /quests/[id].astro)
    if (parts.length > 1) {
      candidates.push(path.join(pagesDir, basePath, '[id].astro'));
    }
    
    // Check for nested dynamic routes (e.g., /quests/play/2 -> /quests/[pathId]/[questId].astro)
    if (parts.length > 2) {
      candidates.push(path.join(pagesDir, basePath, '[pathId]', '[questId].astro'));
    }

    // Check for nested docs routes (e.g., /docs/outages/2026-01-02 -> /docs/outages/[slug].astro)
    if (basePath === 'docs' && parts.length > 2 && parts[1]) {
      candidates.push(path.join(pagesDir, 'docs', parts[1], '[slug].astro'));
    }
    
    // Check for item routes (e.g., /inventory/item/37 -> /inventory/item/[itemId]/index.astro)
    if (parts.length > 2 && parts[1]) {
      candidates.push(path.join(pagesDir, basePath, parts[1], '[itemId]', 'index.astro'));
      candidates.push(path.join(pagesDir, basePath, parts[1], '[itemId].astro'));
      candidates.push(path.join(pagesDir, basePath, parts[1], '[id]', 'index.astro'));
      candidates.push(path.join(pagesDir, basePath, parts[1], '[id].astro'));
    }

    // Check for nested item routes (e.g., /inventory/item/37/edit -> /inventory/item/[itemId]/edit.astro)
    if (parts.length > 3 && parts[1]) {
      candidates.push(path.join(pagesDir, basePath, parts[1], '[itemId]', `${parts[3]}.astro`));
      candidates.push(path.join(pagesDir, basePath, parts[1], '[id]', `${parts[3]}.astro`));
    }
    
    // Check for process routes (e.g., /processes/launch-rocket -> /processes/[processId].astro)
    if (basePath === 'processes' && parts.length > 1) {
      candidates.push(path.join(pagesDir, 'processes', '[processId].astro'));
    }
    
    // Check for catch-all routes
    candidates.push(path.join(pagesDir, basePath, '[...slug].astro'));
  }
  
  return candidates.some(candidate => existsSync(candidate));
}

function stripHashAndQuery(value) {
  const [beforeHash] = value.split('#');
  const [beforeQuery] = beforeHash.split('?');
  return beforeQuery;
}

for (const file of markdownFiles) {
  const content = await readFile(file, 'utf8');
  let match;
  while ((match = linkPattern.exec(content)) !== null) {
    const rawLink = match[1].trim();
    if (!rawLink) continue;
    if (rawLink.startsWith('#')) continue;
    if (rawLink.includes('://')) {
      if (staleDspaceBranchPattern.test(rawLink)) {
        broken.push({ file, link: rawLink });
        continue;
      }
      const githubPrefix = githubPrefixes.find((prefix) => rawLink.startsWith(prefix));
      if (githubPrefix) {
        const githubTarget = stripHashAndQuery(rawLink);
        const githubPath = decodeURIComponent(
          githubTarget.slice(githubPrefix.length).replace(/^\/+/, '')
        );
        const resolvedGithubPath = path.resolve(repoRoot, githubPath);
        const relativeGithubPath = path.relative(repoRoot, resolvedGithubPath);
        if (
          !relativeGithubPath.startsWith('..') &&
          !path.isAbsolute(relativeGithubPath) &&
          existsSync(resolvedGithubPath)
        ) {
          continue;
        }
        broken.push({ file, link: rawLink });
      }
      continue;
    }
    if (rawLink.startsWith('mailto:')) continue;
    if (rawLink.startsWith('data:')) continue;
    if (rawLink.startsWith('javascript:')) continue;
    if (rawLink.startsWith('<')) continue;

    const targetPath = stripHashAndQuery(rawLink);
    if (!targetPath) continue;

    // Handle internal routes (starting with /)
    if (rawLink.startsWith('/')) {
      if (rawLink.startsWith('/docs/')) {
        const docsSlug = targetPath.replace(/^\/docs\//, '').replace(/\/$/, '');
        if (docsSlug && !docsSlug.includes('/')) {
          if (!docsSlugSet.has(docsSlug.toLowerCase())) {
            broken.push({ file, link: rawLink });
            continue;
          }
        }
      }
      if (resolveInternalRoute(targetPath)) continue;
      
      // Check if it's a static asset
      const assetPath = path.join('frontend/public', targetPath);
      if (existsSync(assetPath)) continue;
      
      // Check root public assets
      const rootAssetPath = path.join('public', targetPath);
      if (existsSync(rootAssetPath)) continue;
      
      broken.push({ file, link: rawLink });
      continue;
    }

    // Handle relative links
    const normalized = targetPath.replace(/%20/g, ' ');
    const absolute = path.resolve(path.dirname(file), normalized);
    if (existsSync(absolute)) continue;

    const withMd = absolute.endsWith('.md') ? absolute : `${absolute}.md`;
    if (existsSync(withMd)) continue;

    broken.push({ file, link: rawLink });
  }
}

if (broken.length > 0) {
  console.error('Broken local links detected:');
  for (const { file, link } of broken) {
    console.error(`- ${file}: ${link}`);
  }
  process.exit(1);
}

console.log('All local markdown links resolved.');
