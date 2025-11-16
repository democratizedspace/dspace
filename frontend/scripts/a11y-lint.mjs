import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { compile, walk } from 'svelte/compiler';
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

function getPositionFromIndex(source, index) {
    if (typeof index !== 'number' || index < 0) {
        return undefined;
    }

    let line = 1;
    let column = 1;
    for (let i = 0; i < index; i += 1) {
        if (source[i] === '\n') {
            line += 1;
            column = 1;
        } else {
            column += 1;
        }
    }

    return { line, column };
}

function collectButtonTypeIssues(source, ast, filename) {
    if (!ast?.html) {
        return [];
    }

    const issues = [];
    walk(ast.html, {
        enter(node) {
            if (node.type !== 'Element' || node.name !== 'button') {
                return;
            }

            const hasTypeAttribute = node.attributes.some((attribute) => {
                if (attribute.type !== 'Attribute' || attribute.name !== 'type') {
                    return false;
                }

                if (!Array.isArray(attribute.value) || attribute.value.length === 0) {
                    return false;
                }

                return attribute.value.some((value) => {
                    if (value.type === 'Text') {
                        return value.data.trim().length > 0;
                    }

                    return true;
                });
            });

            if (!hasTypeAttribute) {
                issues.push({
                    type: 'button-type',
                    message: 'Button elements must declare a type attribute.',
                    filename,
                    position: getPositionFromIndex(source, node.start ?? -1),
                });
            }
        },
    });

    return issues;
}

function getAttribute(node, name) {
    return node.attributes.find((attribute) => {
        return attribute.type === 'Attribute' && attribute.name === name;
    });
}

function attributeHasValue(attribute) {
    if (!attribute || !Array.isArray(attribute.value) || attribute.value.length === 0) {
        return false;
    }

    return attribute.value.some((value) => {
        if (value.type === 'Text') {
            return value.data.trim().length > 0;
        }

        return true;
    });
}

function collectEmptyAriaLabelIssues(source, ast, filename) {
    if (!ast?.html) {
        return [];
    }

    const issues = [];
    walk(ast.html, {
        enter(node) {
            if (node.type !== 'Element') {
                return;
            }

            const ariaLabelAttr = getAttribute(node, 'aria-label');

            if (!ariaLabelAttr) {
                return;
            }

            // Check if the aria-label value is empty or whitespace-only
            const hasContent = attributeHasValue(ariaLabelAttr);

            if (!hasContent) {
                issues.push({
                    type: 'empty-aria-label',
                    message: 'Elements with aria-label must provide meaningful text, not empty or whitespace-only values.',
                    filename,
                    position: getPositionFromIndex(source, node.start ?? -1),
                });
            }
        },
    });

    return issues;
}

function hasTitleChild(node) {
    return (node.children ?? []).some((child) => {
        if (child.type !== 'Element' || child.name !== 'title') {
            return false;
        }

        if (!Array.isArray(child.children) || child.children.length === 0) {
            return false;
        }

        return child.children.some((grandchild) => {
            if (grandchild.type === 'Text') {
                return grandchild.data.trim().length > 0;
            }

            return grandchild.type === 'MustacheTag';
        });
    });
}

function collectSvgAccessibilityIssues(source, ast, filename) {
    if (!ast?.html) {
        return [];
    }

    const issues = [];

    walk(ast.html, {
        enter(node) {
            if (node.type !== 'Element' || node.name !== 'svg') {
                return;
            }

            const ariaHiddenAttr = getAttribute(node, 'aria-hidden');
            if (ariaHiddenAttr && attributeHasValue(ariaHiddenAttr)) {
                const value = ariaHiddenAttr.value[0];
                if (value.type === 'Text' && value.data.trim().toLowerCase() === 'true') {
                    return;
                }
            }

            const roleAttr = getAttribute(node, 'role');
            const roleValue = roleAttr?.value?.find((value) => value.type === 'Text')?.data;
            if (roleValue && ['presentation', 'none'].includes(roleValue.trim().toLowerCase())) {
                return;
            }

            const hasAriaLabel = attributeHasValue(getAttribute(node, 'aria-label'));
            const hasAriaLabelledby = attributeHasValue(getAttribute(node, 'aria-labelledby'));
            const hasTitle = hasTitleChild(node);

            if (!hasAriaLabel && !hasAriaLabelledby && !hasTitle) {
                issues.push({
                    type: 'svg-accessible-name',
                    message:
                        'Provide an accessible name for SVG icons (aria-label, aria-labelledby, or <title>) or ' +
                        'mark them aria-hidden.',
                    filename,
                    position: getPositionFromIndex(source, node.start ?? -1),
                });
            }
        },
    });

    return issues;
}

export function checkSourceForA11yWarnings(source, filename = 'inline.svelte') {
    const issues = [];

    try {
        const { warnings, ast } = compile(source, { filename });
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

        const buttonIssues = collectButtonTypeIssues(source, ast, filename);
        issues.push(...buttonIssues);

        const ariaLabelIssues = collectEmptyAriaLabelIssues(source, ast, filename);
        issues.push(...ariaLabelIssues);

        const svgIssues = collectSvgAccessibilityIssues(source, ast, filename);
        issues.push(...svgIssues);
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
