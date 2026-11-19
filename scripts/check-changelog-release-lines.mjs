// Adapt the maintenance release-line guard to main's explicit draft lifecycle.
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { getChangelogStatus } from '../frontend/src/utils/changelogState.mjs';

const { parse } = createRequire(import.meta.url)('yaml');
const versionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
// Closed historical exceptions, not a bypass for new releases.
const historicalFiles = new Set([
  '20221003.md',
  '20221005.md',
  '20221015.md',
  '20221019.md',
  '20221031.md',
  '20221210.md',
  '20230101.md',
  '20230105.md',
  '20230131.md',
  '20260301.md',
]);
const historicalBaseHeadings = {
  '2.0.0': '20230630.md',
  '2.1.0': '20230915.md',
  '3.0.0': '20260401.md',
};

function dateFilename(name) {
  if (!/^\d{8}\.md$/.test(name)) return false;
  const date = `${name.slice(0, 4)}-${name.slice(4, 6)}-${name.slice(6, 8)}`;
  const parsed = new Date(`${date}T00:00:00Z`);
  return (
    !Number.isNaN(parsed.valueOf()) && parsed.toISOString().startsWith(date)
  );
}

function withoutFences(body) {
  let fence;
  return body
    .split('\n')
    .filter((line) => {
      const marker = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
      if (fence) {
        if (
          marker &&
          marker[1][0] === fence[0] &&
          marker[1].length >= fence.length &&
          !marker[2].trim()
        )
          fence = undefined;
        return false;
      }
      if (marker && !(marker[1][0] === '`' && marker[2].includes('`'))) {
        fence = marker[1];
        return false;
      }
      return true;
    })
    .join('\n');
}

export function validateChangelogReleaseLines(
  { releases, legacyFiles },
  files,
  currentVersion
) {
  const errors = [];
  const owners = new Map();
  const lineFiles = new Map();
  for (const [version, file] of Object.entries(releases)) {
    const parts = versionPattern.exec(version);
    if (!parts || Number(parts[3]) !== 0) {
      errors.push(
        `${version}: only major/minor releases (patch zero) get a new file`
      );
      continue;
    }
    if (owners.has(file))
      errors.push(`${file}: multiple release lines share one file`);
    owners.set(file, version);
    lineFiles.set(`${parts[1]}.${parts[2]}`, file);
  }
  const legacy = new Set(legacyFiles);
  if (legacy.size !== legacyFiles.length)
    errors.push('Duplicate legacy file exception');
  for (const file of legacy) {
    if (!historicalFiles.has(file))
      errors.push(`${file}: new files cannot use a historical exception`);
    if (owners.has(file))
      errors.push(`${file}: release file cannot also be legacy`);
  }
  for (const file of [...owners.keys(), ...legacy]) {
    if (!(file in files)) errors.push(`${file}: mapped changelog is missing`);
  }

  const seen = new Set();
  for (const [file, raw] of Object.entries(files)) {
    if (!dateFilename(file))
      errors.push(`${file}: expected a valid YYYYMMDD.md date`);
    if (!owners.has(file) && !legacy.has(file))
      errors.push(`${file}: new changelog needs a major/minor release mapping`);
    const content = raw.replace(/\r\n/g, '\n');
    const match = /^---\n([\s\S]*?)\n---(?:\n|$)/.exec(content);
    let frontmatter;
    try {
      if (!match) throw new Error('Missing frontmatter');
      frontmatter = parse(match[1]);
      getChangelogStatus(frontmatter);
      if (String(frontmatter.slug) !== file.slice(0, -3))
        throw new Error('Slug must match filename');
    } catch (error) {
      errors.push(`${file}: ${error.message}`);
      continue;
    }
    // The existing v3.1 draft declares its full version in the tagline. This is
    // an explicit declaration, unlike incidental version mentions in prose.
    const tagline = /^v(\d+\.\d+\.\d+)(?![\w.+-])/.exec(
      String(frontmatter.tagline ?? '')
    )?.[1];
    const base = owners.get(file);
    if (tagline && tagline !== base)
      errors.push(`${file}: tagline version must match mapped base ${base}`);
    const body = withoutFences(content.slice(match[0].length));
    let previousPatch = 0;
    let baseHeading = false;
    for (const heading of body.matchAll(
      /^ {0,3}#{1,6}[ \t]+.*\bv(\d+\.\d+\.\d+)(?![\w.+-])[^\n]*$/gm
    )) {
      const version = heading[1];
      const parts = versionPattern.exec(version);
      if (!parts) {
        errors.push(`${file}: invalid version ${version}`);
        continue;
      }
      const patch = Number(parts[3]);
      if (seen.has(version))
        errors.push(`${version}: duplicate release section`);
      seen.add(version);
      if (lineFiles.get(`${parts[1]}.${parts[2]}`) !== file)
        errors.push(
          `${version}: section must remain in its mapped release-line file`
        );
      if (patch > 0) {
        if (patch !== previousPatch + 1)
          errors.push(
            `${file}: patch sections must append immediately after their predecessor`
          );
        previousPatch = patch;
      } else {
        if (previousPatch > 0)
          errors.push(`${file}: major/minor section must precede its patches`);
        if (version === base) baseHeading = true;
      }
    }
    if (
      base &&
      !baseHeading &&
      tagline !== base &&
      historicalBaseHeadings[base] !== file
    ) {
      errors.push(
        `${file}: missing major/minor version heading or tagline v${base}`
      );
    }
  }
  const current = versionPattern.exec(currentVersion);
  if (!current || !lineFiles.has(`${current[1]}.${current[2]}`)) {
    errors.push(
      `${currentVersion}: current application release line has no changelog mapping`
    );
  } else if (Number(current[3]) > 0 && !seen.has(currentVersion)) {
    errors.push(
      `${currentVersion}: current patch needs an addendum in its release-line file`
    );
  }
  return errors;
}

export function checkRepository(
  root = fileURLToPath(new URL('../', import.meta.url))
) {
  const directory = resolve(root, 'frontend/src/pages/docs/md/changelog');
  const files = Object.fromEntries(
    readdirSync(directory)
      .filter((name) => name.endsWith('.md'))
      .map((name) => [name, readFileSync(resolve(directory, name), 'utf8')])
  );
  const manifest = JSON.parse(
    readFileSync(resolve(root, 'docs/changelog-release-lines.json'), 'utf8')
  );
  const { version } = JSON.parse(
    readFileSync(resolve(root, 'package.json'), 'utf8')
  );
  return validateChangelogReleaseLines(manifest, files, version);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const errors = checkRepository();
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } else
    console.log(
      'Changelog release lines, patch placement and explicit lifecycle passed.'
    );
}
