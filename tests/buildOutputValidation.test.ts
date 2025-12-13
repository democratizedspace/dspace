import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

describe('build output validation', () => {
    const repoRoot = process.cwd();
    const distPath = join(repoRoot, 'frontend', 'dist');

    function findBuildFiles(dir: string): string[] {
        const files: string[] = [];

        try {
            const entries = readdirSync(dir);
            for (const entry of entries) {
                const fullPath = join(dir, entry);
                const stat = statSync(fullPath);

                if (stat.isDirectory()) {
                    files.push(...findBuildFiles(fullPath));
                } else if (entry.endsWith('.html') || entry.endsWith('.js') || entry.endsWith('.mjs')) {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            // Directory might not exist if build hasn't run
        }

        return files;
    }

    function getBuildFiles(): string[] {
        const files = findBuildFiles(distPath);

        if (files.length > 0) {
            return files;
        }

        // CI should cache frontend/dist between jobs to avoid rebuilding on every test run.
        execSync('npm run build', { stdio: 'inherit' });
        return findBuildFiles(distPath);
    }

    it('should not contain /src/scripts/ paths in built files', () => {
        const buildFiles = getBuildFiles();

        expect(buildFiles.length).toBeGreaterThan(0);

        for (const buildFile of buildFiles) {
            const contents = readFileSync(buildFile, 'utf8');

            // Check for any /src/scripts/ path
            const srcScriptsMatch = contents.match(/["']\/src\/scripts\/[^"']+\.(?:js|mjs)["']/);
            if (srcScriptsMatch) {
                const relativePath = buildFile.startsWith(repoRoot)
                    ? buildFile.slice(repoRoot.length + 1)
                    : buildFile;
                throw new Error(
                    `Found unbundled /src/scripts/ reference in ${relativePath}: ${srcScriptsMatch[0]}`
                );
            }
        }
    }, 120000);
});
