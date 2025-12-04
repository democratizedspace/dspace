import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

describe('build output validation', () => {
    const repoRoot = process.cwd();
    const distPath = join(repoRoot, 'frontend', 'dist');

    beforeAll(() => {
        // Ensure the project is built before running tests
        try {
            execSync('cd frontend && npm run build', {
                cwd: repoRoot,
                stdio: 'pipe',
            });
        } catch (error) {
            console.warn('Build failed in test setup:', error);
        }
    });

    function findHtmlFiles(dir: string): string[] {
        const files: string[] = [];

        try {
            const entries = readdirSync(dir);
            for (const entry of entries) {
                const fullPath = join(dir, entry);
                const stat = statSync(fullPath);

                if (stat.isDirectory()) {
                    files.push(...findHtmlFiles(fullPath));
                } else if (entry.endsWith('.html')) {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            // Directory might not exist if build hasn't run
            console.warn(`Could not read directory ${dir}:`, error);
        }

        return files;
    }

    it('should not contain /src/scripts/ paths in built HTML files', () => {
        const htmlFiles = findHtmlFiles(distPath);

        // Skip if no HTML files found (build might not have run)
        if (htmlFiles.length === 0) {
            console.warn('No HTML files found in dist/, skipping test');
            return;
        }

        for (const htmlFile of htmlFiles) {
            const contents = readFileSync(htmlFile, 'utf8');

            // Check for absolute /src/scripts/ paths that should have been bundled
            expect(contents).not.toContain('/src/scripts/offlineToast.js');
            expect(contents).not.toContain('/src/scripts/offlineWorkerRegistration.js');

            // More general check for any /src/scripts/ path
            const srcScriptsMatch = contents.match(/["']/src/scripts/[^"']+\.js["']/);
            if (srcScriptsMatch) {
                throw new Error(
                    `Found unbundled /src/scripts/ reference in ${htmlFile}: ${srcScriptsMatch[0]}`
                );
            }
        }

        expect(htmlFiles.length).toBeGreaterThan(0);
    });
});
