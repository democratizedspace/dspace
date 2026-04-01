import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

type DependencyMap = Record<string, string>;

type PackageJsonDependencies = {
    dependencies?: DependencyMap;
    devDependencies?: DependencyMap;
    optionalDependencies?: DependencyMap;
    peerDependencies?: DependencyMap;
};

const repoRoot = join(__dirname, '..');
const frontendPackage = JSON.parse(
    readFileSync(join(repoRoot, 'frontend', 'package.json'), 'utf8')
) as PackageJsonDependencies;

describe('canvas dependency alignment', () => {
    it('does not keep a direct frontend canvas dependency in any dependency block', () => {
        const {
            dependencies = {},
            devDependencies = {},
            optionalDependencies = {},
            peerDependencies = {},
        } = frontendPackage;

        expect(dependencies).not.toHaveProperty('canvas');
        expect(devDependencies).not.toHaveProperty('canvas');
        expect(optionalDependencies).not.toHaveProperty('canvas');
        expect(peerDependencies).not.toHaveProperty('canvas');
    });
});
