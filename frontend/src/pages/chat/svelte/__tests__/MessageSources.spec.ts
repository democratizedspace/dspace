import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Message from '../Message.svelte';

describe('Message context sources', () => {
    it('links internal context sources and keeps unsupported destinations as text', () => {
        const { getByRole, getByText, queryByRole } = render(Message, {
            messageMarkdown: 'Here are the sources.',
            className: 'assistant',
            timestamp: Date.now(),
            contextSources: [
                { type: 'doc', id: 'route', label: 'Routes', url: '/docs/routes#inventory' },
                {
                    type: 'item',
                    id: 'item',
                    label: 'Inventory item',
                    url: '/inventory/item/37',
                },
                {
                    type: 'doc',
                    id: 'external',
                    label: 'External docs',
                    url: 'https://example.invalid/docs',
                },
                {
                    type: 'doc',
                    id: 'email',
                    label: 'Email reference',
                    url: 'mailto:docs@example.invalid',
                },
                { type: 'doc', id: 'bare', label: 'Incomplete path', url: '//' },
                { type: 'doc', id: 'delimiter', label: 'Mixed delimiter', url: '/docs\\routes' },
                {
                    type: 'doc',
                    id: 'whitespace',
                    label: 'Control character',
                    url: '/docs/rou\ttes',
                },
                { type: 'state', id: 'local', label: 'Local game state' },
            ],
        });
        getByText('Sources used').click();
        expect(getByRole('link', { name: 'Routes' }).getAttribute('href')).toBe(
            '/docs/routes#inventory'
        );
        expect(getByRole('link', { name: 'Inventory item' }).getAttribute('href')).toBe(
            '/inventory/item/37'
        );
        for (const label of [
            'External docs',
            'Email reference',
            'Incomplete path',
            'Mixed delimiter',
            'Control character',
            'Local game state',
        ]) {
            expect(getByText(label).textContent).toBe(label);
            expect(queryByRole('link', { name: label })).toBeNull();
        }
    });
});
