/** @jest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import { copyToClipboard } from '../src/utils/copyToClipboard.js';

describe('copyToClipboard', () => {
    it('uses navigator.clipboard when available', async () => {
        const writeText = vi.fn().mockResolvedValue();
        Object.assign(navigator, { clipboard: { writeText } });
        await copyToClipboard('hello');
        expect(writeText).toHaveBeenCalledWith('hello');
    });

    it('falls back to execCommand when clipboard API is missing', async () => {
        Object.assign(navigator, { clipboard: undefined });
        const execCommand = vi.fn();
        document.execCommand = execCommand;
        await copyToClipboard('hi');
        expect(execCommand).toHaveBeenCalledWith('copy');
    });
});
