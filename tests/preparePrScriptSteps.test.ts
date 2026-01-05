import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('prepare-pr.sh automation', () => {
    const scriptPath = path.join(__dirname, '..', 'frontend', 'scripts', 'prepare-pr.sh');
    const script = fs.readFileSync(scriptPath, 'utf8');

    it('invokes lint and formatting via npm run check when lint is not skipped', () => {
        expect(script).toMatch(/SKIP_LINT[\s\S]*npm run check/);
    });

    it('runs root unit tests when not explicitly skipped', () => {
        expect(script).toMatch(/SKIP_UNIT_TESTS[\s\S]*npm run test:root/);
    });

    it('executes grouped Playwright suites when E2E checks are enabled', () => {
        expect(script).toMatch(/SKIP_E2E[\s\S]*npm run test:e2e:groups/);
    });
});

describe('qa:smoke shortcut', () => {
    const pkgPath = path.join(__dirname, '..', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as {
        scripts?: Record<string, string>;
    };

    it('covers type checking before link and content validation', () => {
        const qaSmoke = pkg.scripts?.['qa:smoke'] ?? '';
        expect(qaSmoke).toContain('npm run type-check');
        expect(qaSmoke.indexOf('npm run type-check')).toBeLessThan(
            qaSmoke.indexOf('npm run link-check')
        );
    });
});
