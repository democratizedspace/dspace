import { execSync } from 'node:child_process';
import { readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from 'vitest';

test('backup script creates tarball', () => {
    const dir = path.resolve('backups');
    rmSync(dir, { recursive: true, force: true });
    execSync('node scripts/backup.mjs package.json');
    const files = readdirSync(dir);
    expect(files.length).toBe(1);
    expect(files[0]).toMatch(/^backup-.*\.tar\.gz$/);
    rmSync(dir, { recursive: true, force: true });
});
