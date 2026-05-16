import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';

describe('package.json', () => {
  it('declares pnpm with a full semver version', () => {
    const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));
    expect(pkg.packageManager).toMatch(/^pnpm@\d+\.\d+\.\d+$/);
  });
});

describe('frontend/package.json', () => {
  it('has no duplicate devDependencies', () => {
    const pkgPath = join(__dirname, '..', 'frontend', 'package.json');
    const text = readFileSync(pkgPath, 'utf8');
    const match = text.match(/"devDependencies"\s*:\s*{([^}]*)}/s);
    expect(match).toBeTruthy();
    const block = match![1];
    const counts: Record<string, number> = {};
    const regex = /"([^"\n]+)":/g;
    let m;
    while ((m = regex.exec(block)) !== null) {
      const name = m[1];
      counts[name] = (counts[name] || 0) + 1;
    }
    const duplicates = Object.entries(counts)
      .filter(([, c]) => c > 1)
      .map(([name]) => name);
    expect(duplicates).toEqual([]);
  });
});

function readNpmrcLines(...segments: string[]) {
  const npmrcPath = join(__dirname, '..', ...segments);
  expect(existsSync(npmrcPath)).toBe(true);

  return readFileSync(npmrcPath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

describe('.npmrc', () => {
  it('keeps package-manager pinning in package.json instead of npm project config', () => {
    const lines = readNpmrcLines('.npmrc');
    expect(lines).not.toContain('packageManager=pnpm@9.0.0');
  });

  it('disables npm update-notifier noise for root scripts', () => {
    const lines = readNpmrcLines('.npmrc');
    expect(lines).toContain('update-notifier=false');
  });

  it('keeps frontend npm peer behavior explicit for local installs', () => {
    const lines = readNpmrcLines('frontend', '.npmrc');
    expect(lines).toContain('legacy-peer-deps=true');
  });

  it('disables npm update-notifier noise for frontend scripts', () => {
    const lines = readNpmrcLines('frontend', '.npmrc');
    expect(lines).toContain('update-notifier=false');
  });
});
