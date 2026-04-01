import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import QuestLinkChips from '../svelte/QuestLinkChips.svelte';

describe('QuestLinkChips', () => {
    it('renders nothing when questIds is not an array', () => {
        const { queryByTestId } = render(QuestLinkChips, {
            props: { questIds: 'welcome/howtodoquests' as unknown as string[] },
        });

        expect(queryByTestId('quest-link-chip-list')).toBeNull();
    });

    it('canonicalizes, deduplicates, and falls back to quest id labels', () => {
        const { getByRole, queryAllByRole } = render(QuestLinkChips, {
            props: {
                questIds: ['3dprinter/start', '3dprinting/start', 'custom/tree_1', '   '],
                invertChips: false,
            },
        });

        const builtInLink = getByRole('link', { name: 'Set up your first 3D printer' });
        expect(builtInLink.getAttribute('href')).toBe('/quests/3dprinting/start');
        expect(builtInLink.classList.contains('inverted')).toBe(false);

        const fallbackLink = getByRole('link', { name: 'custom/tree_1' });
        expect(fallbackLink.getAttribute('href')).toBe('/quests/custom/tree_1');

        expect(queryAllByRole('link')).toHaveLength(2);
    });
});
