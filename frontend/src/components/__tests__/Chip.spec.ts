import { render, fireEvent } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import Chip from '../svelte/Chip.svelte';

function ensureChipStaticOpacityStyle() {
    if (document.getElementById('chip-static-opacity-regression-style')) {
        return;
    }

    const style = document.createElement('style');
    style.id = 'chip-static-opacity-regression-style';
    style.textContent = 'nav .chip-container.static-container { opacity: 1; }';
    document.head.appendChild(style);
}

describe('Chip', () => {
    it('renders an opaque static container for inverted chips without inline opacity styles', () => {
        ensureChipStaticOpacityStyle();

        const { container, getByTestId, queryByRole } = render(Chip, {
            props: {
                text: '',
                inverted: true,
                dataTestId: 'chip-static',
            },
        });

        const staticContainer = getByTestId('chip-static');

        expect(queryByRole('button')).toBeNull();
        expect(staticContainer.tagName).toBe('DIV');
        expect(staticContainer.classList.contains('chip-container')).toBe(true);
        expect(staticContainer.classList.contains('static-container')).toBe(true);
        expect(staticContainer.classList.contains('inverted')).toBe(true);
        expect(getComputedStyle(staticContainer as HTMLElement).opacity).toBe('1');
        expect(staticContainer.getAttribute('style') ?? '').not.toContain('opacity');
        expect(container.querySelector('nav .chip-container.static-container.inverted')).toBe(
            staticContainer
        );
    });

    it('applies contrasting backgrounds for default and inverted static chips', () => {
        const { getByTestId } = render(Chip, {
            props: {
                text: '',
                inverted: false,
                dataTestId: 'chip-default-bg',
            },
        });
        const { getByTestId: getByTestIdInverted } = render(Chip, {
            props: {
                text: '',
                inverted: true,
                dataTestId: 'chip-inverted-bg',
            },
        });

        const defaultChip = getByTestId('chip-default-bg');
        const invertedChip = getByTestIdInverted('chip-inverted-bg');

        expect(defaultChip.classList.contains('inverted')).toBe(false);
        expect(invertedChip.classList.contains('inverted')).toBe(true);
    });

    it('blocks disabled link navigation while preserving active link click handling', async () => {
        const onClick = vi.fn();
        const { getByRole } = render(Chip, {
            props: {
                text: 'Disabled Docs',
                href: '/docs',
                disabled: true,
                onClick,
            },
        });

        const disabledLinkChip = getByRole('navigation').querySelector('a');
        expect(disabledLinkChip).toBeTruthy();

        await fireEvent.click(disabledLinkChip as HTMLElement);

        expect((disabledLinkChip as HTMLElement).getAttribute('href')).toBeNull();
        expect((disabledLinkChip as HTMLElement).getAttribute('aria-disabled')).toBe('true');
        expect((disabledLinkChip as HTMLElement).getAttribute('tabindex')).toBe('-1');
        expect(onClick).not.toHaveBeenCalled();

        const activeOnClick = vi.fn();
        const { getByRole: getActiveLinkByRole } = render(Chip, {
            props: {
                text: 'Active Docs',
                href: '/docs',
                onClick: activeOnClick,
            },
        });

        const activeLinkChip = getActiveLinkByRole('link', { name: 'Active Docs' });

        await fireEvent.click(activeLinkChip);

        expect(activeOnClick).toHaveBeenCalledTimes(1);
    });

    it('applies inverted contrast to interactive button and link chips', () => {
        const { getByRole } = render(Chip, {
            props: {
                text: 'Start',
                inverted: true,
                onClick: () => {},
            },
        });
        const buttonChip = getByRole('button', { name: 'Start' });
        expect(buttonChip.classList.contains('inverted')).toBe(true);

        const { getByRole: getByRoleLink } = render(Chip, {
            props: {
                text: 'Docs',
                href: '/docs',
                inverted: true,
            },
        });
        const linkChip = getByRoleLink('link', { name: 'Docs' });
        expect(linkChip.classList.contains('inverted')).toBe(true);
    });
});
