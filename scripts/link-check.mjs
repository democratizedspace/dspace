#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { glob } from 'glob';

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
const docsMarkdownFiles = await glob('frontend/src/pages/docs/md/*.md');
const docsSlugs = new Set();

for (const file of docsMarkdownFiles) {
  const content = await readFile(file, 'utf8');
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) continue;
  const slugMatch = frontmatterMatch[1].match(/^\s*slug:\s*['"]?([^'"\n]+)['"]?\s*$/m);
  if (slugMatch) {
    docsSlugs.add(slugMatch[1].trim().toLowerCase());
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
    if (basePath === 'docs' && parts.length > 1) {
      const docSlug = parts[1].toLowerCase();
      if (docsSlugs.has(docSlug)) {
        return true;
      }
      return false;
    }
    
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

function validateGithubLink(rawLink) {
  let url;
  try {
    url = new URL(rawLink);
  } catch {
    return null;
  }

  if (url.hostname !== 'github.com') return null;
  if (!url.pathname.startsWith('/democratizedspace/dspace/')) return null;

  const repoPath = url.pathname.replace('/democratizedspace/dspace/', '');
  const parts = repoPath.split('/').filter(Boolean);
  if (parts.length < 2) return null;

  const [resourceType, ref, ...resourcePathParts] = parts;
  if (resourceType !== 'blob' && resourceType !== 'tree') return null;

  if (resourceType === 'blob' && resourcePathParts.length === 0) {
    return 'missing file path';
  }

  if (resourceType === 'tree' && resourcePathParts.length === 0) {
    return null;
  }

  const repoRelativePath = decodeURIComponent(resourcePathParts.join('/'));
  if (!repoRelativePath) return null;

  const refToCheck = ['main', 'master', 'v3'].includes(ref) ? 'HEAD' : ref;
  let gitObjectType;
  try {
    gitObjectType = execFileSync(
      'git',
      ['cat-file', '-t', `${refToCheck}:${repoRelativePath}`],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
    ).trim();
  } catch {
    return `missing ${resourceType} path`;
  }

  if (resourceType === 'blob' && gitObjectType !== 'blob') {
    return 'expected file but found directory';
  }

  if (resourceType === 'tree' && gitObjectType !== 'tree') {
    return 'expected directory but found file';
  }

  return null;
}

for (const file of markdownFiles) {
  const content = await readFile(file, 'utf8');
  let match;
  while ((match = linkPattern.exec(content)) !== null) {
    const rawLink = match[1].trim();
    if (!rawLink) continue;
    if (rawLink.startsWith('#')) continue;
    if (rawLink.includes('://')) {
      const githubError = validateGithubLink(rawLink);
      if (githubError) {
        broken.push({ file, link: `${rawLink} (${githubError})` });
      }
      continue;
    }
    if (rawLink.startsWith('mailto:')) continue;
    if (rawLink.startsWith('data:')) continue;
    if (rawLink.startsWith('javascript:')) continue;
    if (rawLink.startsWith('<')) continue;

    const [targetPath] = rawLink.split('#');
    if (!targetPath) continue;

    // Handle internal routes (starting with /)
    if (rawLink.startsWith('/')) {
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
