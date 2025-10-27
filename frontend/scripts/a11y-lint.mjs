import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { compile } from 'svelte/compiler';
import postcss from 'postcss';
import postcssScss from 'postcss-scss';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const srcDir = path.join(projectRoot, 'src');
const IGNORE_DIRECTORIES = new Set(['node_modules', 'dist', 'build', '.astro', '.svelte-kit']);
const OUTLINE_DENYLIST = new Set(['none', '0', '0px', '0rem', '0em']);

function listSvelteFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        if (entry.isDirectory()) {
            if (IGNORE_DIRECTORIES.has(entry.name)) {
                continue;
            }
            files.push(...listSvelteFiles(path.join(dir, entry.name)));
        } else if (entry.isFile() && entry.name.endsWith('.svelte')) {
            files.push(path.join(dir, entry.name));
        }
    }

    return files;
}

function extractStyleBlocks(source) {
    const blocks = [];
    const styleRegex = /<style(\s+[^>]*)?>([\s\S]*?)<\/style>/g;
    let match;

    while ((match = styleRegex.exec(source)) !== null) {
        const attributes = match[1] ?? '';
        const content = match[2] ?? '';
        const langMatch = attributes.match(/lang=["']([^"']+)["']/i);
        const lang = langMatch ? langMatch[1].toLowerCase() : 'css';

        blocks.push({ content, lang });
    }

    return blocks;
}

function normaliseCssValue(value) {
    return value
        .replace(/!important/i, '')
        .trim()
        .toLowerCase();
}

function isSkippableColorValue(value) {
    return value.includes('var(') || value === 'inherit' || value === 'currentcolor';
}

function analyseCss(content, { filename, lang }) {
    const issues = [];
    if (!content.trim()) {
        return issues;
    }

    const syntax = lang === 'scss' ? postcssScss : undefined;
    let root;

    try {
        root = postcss.parse(content, { from: filename, syntax });
    } catch (error) {
        issues.push({
            type: 'css-parse',
            message: `Could not parse <style> block: ${error.message}`,
            filename,
        });
        return issues;
    }

    root.walkRules((rule) => {
        const colorValues = [];
        const backgroundValues = [];

        rule.walkDecls((decl) => {
            const prop = decl.prop.toLowerCase();
            const rawValue = decl.value;
            const normalised = normaliseCssValue(rawValue);

            if (prop === 'color') {
                colorValues.push({ decl, value: normalised });
            } else if (prop === 'background-color') {
                backgroundValues.push({ decl, value: normalised });
            } else if (prop === 'outline') {
                if (OUTLINE_DENYLIST.has(normalised)) {
                    issues.push({
                        type: 'css-outline',
                        message: 'Avoid removing focus outlines without providing an accessible alternative.',
                        filename,
                        position: decl.source?.start,
                    });
                }
            }
        });

        for (const color of colorValues) {
            if (isSkippableColorValue(color.value)) {
                continue;
            }

            for (const background of backgroundValues) {
                if (isSkippableColorValue(background.value)) {
                    continue;
                }

                if (color.value === background.value) {
                    issues.push({
                        type: 'css-contrast',
                        message: 'Text color matches background color. Ensure sufficient contrast.',
                        filename,
                        position: background.decl.source?.start ?? color.decl.source?.start,
                    });
                }
            }
        }
    });

    return issues;
}

export function checkSourceForA11yWarnings(source, filename = 'inline.svelte') {
    const issues = [];

    try {
        const { warnings } = compile(source, { filename });
        for (const warning of warnings) {
            if (warning.code && warning.code.startsWith('a11y-')) {
                issues.push({
                    type: 'svelte-warning',
                    code: warning.code,
                    message: warning.message,
                    filename,
                    position: warning.start ?? warning.end,
                });
            }
        }
    } catch (error) {
        issues.push({
            type: 'compile-error',
            message: `Failed to compile ${filename}: ${error.message}`,
            filename,
        });
        return issues;
    }

    const styleBlocks = extractStyleBlocks(source);
    styleBlocks.forEach((block, index) => {
        const cssIssues = analyseCss(block.content, {
            filename: `${filename}#style-${index + 1}`,
            lang: block.lang,
        });
        issues.push(...cssIssues);
    });

    return issues;
}

function formatIssue(issue) {
    const location = issue.position
        ? `${issue.position.line ?? '?'}:${issue.position.column ?? '?'}`
        : '';
    const locationSuffix = location ? ` (line ${location})` : '';
    const prefix = issue.code ? `${issue.code}: ` : '';
    return `${prefix}${issue.message}${locationSuffix}`;
}

function run() {
    const files = listSvelteFiles(srcDir);
    const allIssues = [];

    files.forEach((file) => {
        const source = fs.readFileSync(file, 'utf8');
        const issues = checkSourceForA11yWarnings(source, path.relative(projectRoot, file));
        if (issues.length > 0) {
            allIssues.push({ file, issues });
        }
    });

    if (allIssues.length > 0) {
        console.error('Accessibility lint failed. Review the issues below:\n');
        allIssues.forEach(({ file, issues }) => {
            console.error(`\u2022 ${path.relative(projectRoot, file)}`);
            issues.forEach((issue) => {
                console.error(`   - ${formatIssue(issue)}`);
            });
            console.error('');
        });
        process.exit(1);
    }
}

const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedFile === __filename) {
    run();
}
