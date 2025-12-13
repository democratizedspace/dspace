/**
 * SSR Safety Regression Tests
 *
 * These tests ensure that browser-only code (localStorage, IndexedDB, window, etc.)
 * is never executed during server-side rendering. SSR should only render the initial
 * HTML; all interactivity should be handled by Svelte after hydration.
 *
 * The tests focus on static analysis of source files to verify:
 * 1. Files using browser APIs import isBrowser from ssr.js
 * 2. Browser API access is guarded with isBrowser checks
 * 3. Svelte components only access browser APIs in onMount or event handlers
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

describe('SSR Safety - ssr.js utility behavior', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    describe('in browser environment (jsdom)', () => {
        it('should detect browser environment correctly', async () => {
            const { isBrowser, isServer } = await import('../src/utils/ssr.js');
            expect(typeof window).toBe('object');
            expect(isBrowser).toBe(true);
            expect(isServer).toBe(false);
        });

        it('onBrowser should execute function in browser', async () => {
            const { onBrowser } = await import('../src/utils/ssr.js');
            const browserFn = vi.fn(() => 'browser-value');
            const result = onBrowser(browserFn, 'fallback');

            expect(result).toBe('browser-value');
            expect(browserFn).toHaveBeenCalledTimes(1);
        });

        it('onBrowser should return fallback if function throws', async () => {
            const { onBrowser } = await import('../src/utils/ssr.js');
            const browserFn = vi.fn(() => {
                throw new Error('Test error');
            });
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const result = onBrowser(browserFn, 'fallback');

            expect(result).toBe('fallback');
            expect(browserFn).toHaveBeenCalledTimes(1);
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        it('onBrowserAsync should execute async function in browser', async () => {
            const { onBrowserAsync } = await import('../src/utils/ssr.js');
            const browserFn = vi.fn(async () => 'browser-value');
            const result = await onBrowserAsync(browserFn, 'fallback');

            expect(result).toBe('browser-value');
            expect(browserFn).toHaveBeenCalledTimes(1);
        });
    });
});

describe('SSR Safety - Static analysis of source files', () => {
    const frontendDir = path.join(process.cwd());

    describe('JavaScript utility files', () => {
        it('files using localStorage should import isBrowser from ssr.js', () => {
            const filesToCheck = [
                'src/utils/gameState/common.js',
                'src/utils/gameState.js',
                'src/utils/localStorage.js',
                'src/pages/inventory/utils.js',
                'src/components/svelte/menuActive.js',
            ];

            for (const file of filesToCheck) {
                const filePath = path.join(frontendDir, file);
                if (fs.existsSync(filePath)) {
                    const content = fs.readFileSync(filePath, 'utf8');

                    // If file uses localStorage directly (not just in comments)
                    const hasLocalStorageAccess = content.match(
                        /[^/*]localStorage\.(getItem|setItem|removeItem|clear)/
                    );

                    if (hasLocalStorageAccess) {
                        const hasSSRGuard =
                            content.includes("from '../ssr.js'") ||
                            content.includes("from '../../utils/ssr.js'") ||
                            content.includes("from './ssr.js'") ||
                            content.includes('isBrowser');

                        expect(
                            hasSSRGuard,
                            `${file} uses localStorage but doesn't import isBrowser from ssr.js`
                        ).toBe(true);
                    }
                }
            }
        });

        it('files using indexedDB should import isBrowser from ssr.js', () => {
            const filePath = path.join(frontendDir, 'src/utils/indexeddb.js');
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');

                const hasSSRGuard =
                    content.includes("from './ssr.js'") || content.includes('isBrowser');

                expect(
                    hasSSRGuard,
                    "indexeddb.js uses IndexedDB but doesn't import isBrowser from ssr.js"
                ).toBe(true);
            }
        });
    });

    describe('Svelte components', () => {
        it('should guard top-level localStorage access with isBrowser', () => {
            const svelteFiles = glob.sync('src/**/*.svelte', { cwd: frontendDir });

            for (const file of svelteFiles) {
                const filePath = path.join(frontendDir, file);
                const content = fs.readFileSync(filePath, 'utf8');

                // Extract script content (case-insensitive to handle any casing)
                const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
                if (!scriptMatch) continue;

                const scriptContent = scriptMatch[1];
                const lines = scriptContent.split('\n');

                // Track context: are we inside onMount, a function definition, etc.
                let insideOnMount = false;
                let insideFunctionDef = false;
                let braceDepth = 0;
                let onMountDepth = -1;
                let functionDefDepth = -1;

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    const trimmed = line.trim();

                    // Skip comments and imports
                    if (
                        trimmed.startsWith('//') ||
                        trimmed.startsWith('*') ||
                        trimmed.startsWith('import')
                    ) {
                        continue;
                    }

                    // Track onMount entry
                    if (line.includes('onMount(') && !insideOnMount) {
                        insideOnMount = true;
                        onMountDepth = braceDepth;
                    }

                    // Track function definition entry (const fn = () => { or function fn() { or async function)
                    // Matches: const fn = () =>, const fn = (x) =>, const fn = x =>, async function fn()
                    const isFunctionDef =
                        /^\s*(const|let|var)\s+\w+\s*=\s*(async\s+)?(?:\([^)]*\)|\w+)\s*=>/.test(
                            line
                        ) ||
                        /^\s*(async\s+)?function\s+\w+/.test(line) ||
                        /^\s*(const|let|var)\s+\w+\s*=\s*(async\s+)?function/.test(line);

                    if (isFunctionDef && !insideFunctionDef) {
                        insideFunctionDef = true;
                        functionDefDepth = braceDepth;
                    }

                    // Update brace depth
                    const openBraces = (line.match(/\{/g) || []).length;
                    const closeBraces = (line.match(/\}/g) || []).length;
                    braceDepth += openBraces - closeBraces;

                    // Check if we exited onMount or function
                    if (insideOnMount && braceDepth <= onMountDepth) {
                        insideOnMount = false;
                        onMountDepth = -1;
                    }
                    if (insideFunctionDef && braceDepth <= functionDefDepth) {
                        insideFunctionDef = false;
                        functionDefDepth = -1;
                    }

                    // Check for localStorage access
                    const localStorageMatch = line.match(
                        /localStorage\.(getItem|setItem|removeItem|clear)\s*\(/
                    );
                    if (localStorageMatch) {
                        // Safe contexts: inside onMount, inside function definition, or with isBrowser guard
                        const isSafe =
                            insideOnMount ||
                            insideFunctionDef ||
                            line.includes('isBrowser') ||
                            line.includes("typeof window !== 'undefined'");

                        // Also safe if file imports isBrowser and uses it as a guard
                        const hasIsBrowserImport =
                            scriptContent.includes("from '../../utils/ssr.js'") ||
                            scriptContent.includes("from '../../../utils/ssr.js'") ||
                            scriptContent.includes("from '../utils/ssr.js'");

                        if (!isSafe && !hasIsBrowserImport) {
                            expect.fail(
                                `${file}:${
                                    i + 1
                                } has potentially unguarded localStorage access.\n` +
                                    `Line: ${trimmed}\n` +
                                    `Either:\n` +
                                    `  1. Use isBrowser guard: if (isBrowser) { localStorage... }\n` +
                                    `  2. Move to onMount(): onMount(() => { localStorage... })\n` +
                                    `  3. Put inside a function that's only called client-side`
                            );
                        }
                    }
                }
            }
        });

        it('should not access document/window directly at top level', () => {
            const svelteFiles = glob.sync('src/**/*.svelte', { cwd: frontendDir });

            for (const file of svelteFiles) {
                const filePath = path.join(frontendDir, file);
                const content = fs.readFileSync(filePath, 'utf8');

                const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
                if (!scriptMatch) continue;

                const scriptContent = scriptMatch[1];
                const lines = scriptContent.split('\n');

                // Track context
                let insideOnMount = false;
                let insideFunctionDef = false;
                let braceDepth = 0;
                let onMountDepth = -1;
                let functionDefDepth = -1;

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    const trimmed = line.trim();

                    // Skip comments and imports
                    if (
                        trimmed.startsWith('//') ||
                        trimmed.startsWith('*') ||
                        trimmed.startsWith('import')
                    ) {
                        continue;
                    }

                    // Track onMount entry
                    if (line.includes('onMount(') && !insideOnMount) {
                        insideOnMount = true;
                        onMountDepth = braceDepth;
                    }

                    // Track function definition entry
                    // Matches: const fn = () =>, const fn = (x) =>, const fn = x =>, async function fn()
                    const isFunctionDef =
                        /^\s*(const|let|var)\s+\w+\s*=\s*(async\s+)?(?:\([^)]*\)|\w+)\s*=>/.test(
                            line
                        ) ||
                        /^\s*(async\s+)?function\s+\w+/.test(line) ||
                        /^\s*(const|let|var)\s+\w+\s*=\s*(async\s+)?function/.test(line);

                    if (isFunctionDef && !insideFunctionDef) {
                        insideFunctionDef = true;
                        functionDefDepth = braceDepth;
                    }

                    // Update brace depth
                    const openBraces = (line.match(/\{/g) || []).length;
                    const closeBraces = (line.match(/\}/g) || []).length;
                    braceDepth += openBraces - closeBraces;

                    // Check if we exited onMount or function
                    if (insideOnMount && braceDepth <= onMountDepth) {
                        insideOnMount = false;
                        onMountDepth = -1;
                    }
                    if (insideFunctionDef && braceDepth <= functionDefDepth) {
                        insideFunctionDef = false;
                        functionDefDepth = -1;
                    }

                    // Check for top-level document/window/navigator access
                    const dangerousAccess =
                        /^\s*(const|let|var)\s+\w+\s*=\s*(document|window|navigator)\./.test(line);

                    if (dangerousAccess) {
                        const isSafe =
                            insideOnMount ||
                            insideFunctionDef ||
                            line.includes('isBrowser') ||
                            line.includes("typeof window !== 'undefined'") ||
                            line.includes("typeof document !== 'undefined'");

                        if (!isSafe) {
                            expect.fail(
                                `${file}:${i + 1} has unguarded top-level browser API access.\n` +
                                    `Line: ${trimmed}\n` +
                                    `Use isBrowser guard or move to onMount()`
                            );
                        }
                    }
                }
            }
        });
    });

    describe('Required SSR utility presence', () => {
        it('ssr.js utility should exist and export required functions', () => {
            const ssrPath = path.join(frontendDir, 'src/utils/ssr.js');
            expect(fs.existsSync(ssrPath), 'src/utils/ssr.js should exist').toBe(true);

            const content = fs.readFileSync(ssrPath, 'utf8');

            // Check for required exports
            expect(content).toContain('export const isBrowser');
            expect(content).toContain('export const isServer');
            expect(content).toContain('export function onBrowser');
            expect(content).toContain('export async function onBrowserAsync');

            // Verify isBrowser check is correct
            expect(content).toContain("typeof window !== 'undefined'");
        });
    });
});
