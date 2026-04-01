import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

type DependencyMap = Record<string, string>;

type PackageJsonDependencies = {
    dependencies?: DependencyMap;
    devDependencies?: DependencyMap;
};

const repoRoot = join(__dirname, '..');
const frontendPackage = JSON.parse(
    readFileSync(join(repoRoot, 'frontend', 'package.json'), 'utf8')
) as PackageJsonDependencies;

describe('canvas dependency alignment', () => {
    it('does not keep a stale direct frontend canvas pin in dependencies or devDependencies', () => {
        expect(frontendPackage.dependencies ?? {}).not.toHaveProperty('canvas');
        expect(frontendPackage.devDependencies ?? {}).not.toHaveProperty('canvas');
    });
});
