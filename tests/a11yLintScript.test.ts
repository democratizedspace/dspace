import { describe, it, expect } from 'vitest';

const a11yModulePromise = import('../frontend/scripts/a11y-lint.mjs');

describe('a11y lint script', () => {
    it('flags images missing alt text', async () => {
        const { checkSourceForA11yWarnings } = await a11yModulePromise;
        const source = `<img src="/assets/example.png" />`;

        const issues = checkSourceForA11yWarnings(source, 'InlineButton.svelte');
        expect(
            issues.some(
                (issue) => issue.type === 'svelte-warning' && issue.code === 'a11y-missing-attribute'
            )
        ).toBe(true);
    });

    it('detects removed focus outlines', async () => {
        const { checkSourceForA11yWarnings } = await a11yModulePromise;
        const source = `
            <style>
                .link:focus {
                    outline: none;
                }
            </style>
            <a class="link" href="#">Example</a>
        `;

        const issues = checkSourceForA11yWarnings(source, 'OutlineFixture.svelte');
        expect(issues.some((issue) => issue.type === 'css-outline')).toBe(true);
    });

    it('catches identical text and background colors', async () => {
        const { checkSourceForA11yWarnings } = await a11yModulePromise;
        const source = `
            <style>
                .badge {
                    color: #ffffff;
                    background-color: #ffffff;
                }
            </style>
            <div class="badge">Badge</div>
        `;

        const issues = checkSourceForA11yWarnings(source, 'ContrastFixture.svelte');
        expect(issues.some((issue) => issue.type === 'css-contrast')).toBe(true);
    });

    it('requires buttons to declare an explicit type', async () => {
        const { checkSourceForA11yWarnings } = await a11yModulePromise;
        const source = `<button class="cta">Launch</button>`;

        const issues = checkSourceForA11yWarnings(source, 'ButtonFixture.svelte');
        expect(
            issues.some(
                (issue) => issue.type === 'button-type' && /type attribute/i.test(issue.message)
            )
        ).toBe(true);
    });

    it('flags elements with empty aria-label attributes', async () => {
        const { checkSourceForA11yWarnings } = await a11yModulePromise;
        const source = `<div aria-label="">Content</div>`;

        const issues = checkSourceForA11yWarnings(source, 'AriaLabelFixture.svelte');
        expect(
            issues.some(
                (issue) => issue.type === 'empty-aria-label' && /aria-label/i.test(issue.message)
            )
        ).toBe(true);
    });

    it('flags elements with whitespace-only aria-label attributes', async () => {
        const { checkSourceForA11yWarnings } = await a11yModulePromise;
        const source = `<button type="button" aria-label="   ">Click</button>`;

        const issues = checkSourceForA11yWarnings(source, 'AriaLabelWhitespaceFixture.svelte');
        expect(
            issues.some(
                (issue) => issue.type === 'empty-aria-label' && /aria-label/i.test(issue.message)
            )
        ).toBe(true);
    });

    it('allows elements with meaningful aria-label attributes', async () => {
        const { checkSourceForA11yWarnings } = await a11yModulePromise;
        const source = `<button type="button" aria-label="Close dialog">X</button>`;

        const issues = checkSourceForA11yWarnings(source, 'ValidAriaLabel.svelte');
        expect(issues.some((issue) => issue.type === 'empty-aria-label')).toBe(false);
    });

    it('requires SVG icons to expose an accessible name or be explicitly decorative', async () => {
        const { checkSourceForA11yWarnings } = await a11yModulePromise;
        const source = `
            <svg width="16" height="16" viewBox="0 0 16 16">
                <path d="M1 1 L15 15" />
            </svg>
        `;

        const issues = checkSourceForA11yWarnings(source, 'SvgIconMissingLabel.svelte');
        expect(
            issues.some(
                (issue) =>
                    issue.type === 'svg-accessible-name' &&
                    /accessible name for svg icons/i.test(issue.message)
            )
        ).toBe(true);
    });

    it('accepts decorative SVG icons that are explicitly hidden from assistive tech', async () => {
        const { checkSourceForA11yWarnings } = await a11yModulePromise;
        const source = `
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16">
                <path d="M1 1 L15 15" />
            </svg>
        `;

        const issues = checkSourceForA11yWarnings(source, 'DecorativeSvgIcon.svelte');
        expect(issues.some((issue) => issue.type === 'svg-accessible-name')).toBe(false);
    });
});
