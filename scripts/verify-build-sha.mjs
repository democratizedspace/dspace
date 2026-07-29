#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const expected = String(
  process.env.EXPECTED_SHA || process.env.GIT_SHA || ''
).trim();
if (!/^[0-9a-f]{40}$/i.test(expected)) {
  console.error('EXPECTED_SHA must be exactly 40 hexadecimal characters.');
  process.exit(1);
}
const roots = process.argv.slice(2).filter((entry) => fs.existsSync(entry));
if (!roots.length) {
  console.error('No build output directory found.');
  process.exit(1);
}
const placeholders = ['unknown', 'missing-sha', 'dev-local'];
let server = false;
let client = false;
let canonical = false;
const stack = [...roots];
while (stack.length) {
  const current = stack.pop();
  const stat = fs.statSync(current);
  if (stat.isDirectory()) {
    for (const name of fs.readdirSync(current))
      stack.push(path.join(current, name));
    continue;
  }
  if (!/\.(?:js|mjs|cjs|html|json|css)$/.test(current)) continue;
  const text = fs.readFileSync(current, 'utf8');
  if (placeholders.some((value) => text.includes(`v3:${value}`))) {
    console.error(`Placeholder build identity found in ${current}`);
    process.exit(1);
  }
  if (!text.includes(expected)) continue;
  const relative = path.relative(roots[0], current).replaceAll(path.sep, '/');
  if (relative.includes('_astro/') || relative.includes('client/'))
    client = true;
  else server = true;
  if (text.includes('shortRevision') && text.includes(expected.slice(0, 7)))
    canonical = true;
}
if (!server || !client || !canonical) {
  console.error(
    `Build identity verification failed (server=${server}, client=${client}, canonical=${canonical}).`
  );
  process.exit(1);
}
console.log(
  `Verified full build SHA ${expected} in canonical metadata, server output, and client assets.`
);
