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
    it('keeps frontend canvas as a runtime dependency and out of devDependencies', () => {
        expect(frontendPackage.dependencies ?? {}).toHaveProperty('canvas');
        expect(frontendPackage.devDependencies ?? {}).not.toHaveProperty('canvas');
    });
});
