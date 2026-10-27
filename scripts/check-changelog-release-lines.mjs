import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const versionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
// Historical exceptions are closed: new releases must follow the declared format.
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

// Explicit release-line mappings preserve old prose formats without guessing from
// incidental version mentions. New files must be registered as major/minor releases.
export function validateChangelogReleaseLines(
  { releases, legacyFiles },
  files,
  currentVersion
) {
  const errors = [];
  const fileOwners = new Map();
  const lineFiles = new Map();
  for (const [version, file] of Object.entries(releases)) {
    const parts = versionPattern.exec(version);
    if (!parts || Number(parts[3]) !== 0) {
      errors.push(
        `${version}: only major/minor releases (patch zero) get a new file`
      );
      continue;
    }
    const line = `${parts[1]}.${parts[2]}`;
    if (fileOwners.has(file))
      errors.push(`${file}: multiple release lines share one file`);
    fileOwners.set(file, line);
    lineFiles.set(line, file);
  }
  const legacy = new Set(legacyFiles);
  if (legacy.size !== legacyFiles.length)
    errors.push('Duplicate legacy file exception');
  for (const file of legacy) {
    if (!historicalFiles.has(file))
      errors.push(`${file}: new files cannot use a historical exception`);
    if (fileOwners.has(file))
      errors.push(`${file}: release file cannot also be legacy`);
  }
  for (const file of [...fileOwners.keys(), ...legacy]) {
    if (!(file in files)) errors.push(`${file}: mapped changelog is missing`);
  }

  const seenVersions = new Set();
  for (const [file, content] of Object.entries(files)) {
    if (!dateFilename(file))
      errors.push(`${file}: expected a valid YYYYMMDD.md date`);
    if (!fileOwners.has(file) && !legacy.has(file)) {
      errors.push(`${file}: new changelog needs a major/minor release mapping`);
    }
    // Code examples and incidental prose are not release-section declarations.
    let fence;
    const withoutCode = content
      .split(/\r?\n/)
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
    let previousPatch = 0;
    for (const heading of withoutCode.matchAll(
      /^ {0,3}#{1,6}[ \t]+.*\bv(\d+\.\d+\.\d+)(?![\w.+-])[^\n]*$/gm
    )) {
      const version = heading[1];
      const parts = versionPattern.exec(version);
      if (!parts) {
        errors.push(`${file}: invalid version ${version}`);
        continue;
      }
      const line = `${parts[1]}.${parts[2]}`;
      const patch = Number(parts[3]);
      if (seenVersions.has(version))
        errors.push(`${version}: duplicate release section`);
      seenVersions.add(version);
      if (lineFiles.get(line) !== file) {
        errors.push(
          `${version}: section must remain in ${lineFiles.get(line) || 'its mapped release-line file'}`
        );
      }
      if (patch > 0) {
        if (patch !== previousPatch + 1)
          errors.push(
            `${file}: patch sections must append immediately after their predecessor`
          );
        previousPatch = patch;
      } else if (previousPatch > 0) {
        errors.push(`${file}: major/minor section must precede its patches`);
      }
    }
  }
  for (const [version, file] of Object.entries(releases)) {
    if (!seenVersions.has(version) && historicalBaseHeadings[version] !== file)
      errors.push(`${file}: missing major/minor release heading v${version}`);
  }
  const current = versionPattern.exec(currentVersion);
  if (!current || !lineFiles.has(`${current[1]}.${current[2]}`)) {
    errors.push(
      `${currentVersion}: current application release line has no changelog mapping`
    );
  } else if (Number(current[3]) > 0 && !seenVersions.has(currentVersion)) {
    errors.push(
      `${currentVersion}: current patch needs an addendum in its release-line file`
    );
  }
  return errors;
}

export function checkRepository(root) {
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
  const errors = checkRepository(
    fileURLToPath(new URL('../', import.meta.url))
  );
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } else {
    console.log('Changelog release-line mapping and patch placement passed.');
  }
}
