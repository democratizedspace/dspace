/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import QuestReview from '../src/components/svelte/QuestReview.svelte';

describe('QuestReview component', () => {
    it('emits approve and reject events', async () => {
        const quests = [{ id: 'q1', title: 'Test Quest', description: 'desc' }];

        const { getByText, component } = render(QuestReview, { props: { quests } });

        const approveHandler = vi.fn();
        const rejectHandler = vi.fn();

        component.$on('approve', (e) => approveHandler(e.detail));
        component.$on('reject', (e) => rejectHandler(e.detail));

        await fireEvent.click(getByText('Approve'));
        await fireEvent.click(getByText('Reject'));

        expect(approveHandler).toHaveBeenCalledWith({ id: 'q1' });
        expect(rejectHandler).toHaveBeenCalledWith({ id: 'q1' });
    });
});
