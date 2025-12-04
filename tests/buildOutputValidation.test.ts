import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

describe('build output validation', () => {
    const repoRoot = process.cwd();
    const distPath = join(repoRoot, 'frontend', 'dist');

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

        // Fail if no HTML files found (build might not have run)
        if (htmlFiles.length === 0) {
            throw new Error(
                `No HTML files found in ${distPath}. Ensure the build has run before testing.`
            );
        }

        for (const htmlFile of htmlFiles) {
            const contents = readFileSync(htmlFile, 'utf8');

            // Check for any /src/scripts/ path
            const srcScriptsMatch = contents.match(/["']\/src\/scripts\/[^"']+\.js["']/);
            if (srcScriptsMatch) {
                const relativePath = htmlFile.startsWith(repoRoot)
                    ? htmlFile.slice(repoRoot.length + 1)
                    : htmlFile;
                throw new Error(
                    `Found unbundled /src/scripts/ reference in ${relativePath}: ${srcScriptsMatch[0]}`
                );
            }
        }
    });
});
