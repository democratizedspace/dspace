#!/usr/bin/env node
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
    
    // Check for item routes (e.g., /inventory/item/37 -> /inventory/item/[itemId].astro)
    if (parts.length > 2 && parts[1]) {
      candidates.push(path.join(pagesDir, basePath, parts[1], '[itemId].astro'));
      candidates.push(path.join(pagesDir, basePath, parts[1], '[id].astro'));
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

for (const file of markdownFiles) {
  const content = await readFile(file, 'utf8');
  let match;
  while ((match = linkPattern.exec(content)) !== null) {
    const rawLink = match[1].trim();
    if (!rawLink) continue;
    if (rawLink.startsWith('#')) continue;
    if (rawLink.includes('://')) continue;
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
