import { describe, it, expect, vi } from 'vitest';
import { createTouchClickGuard } from '../frontend/src/utils/touchClickGuard.js';

describe('createTouchClickGuard', () => {
    it('invokes action once for touchstart + click sequence', async () => {
        const guard = createTouchClickGuard();
        const action = vi.fn();
        const touchEvent = {
            type: 'touchstart',
            preventDefault: vi.fn(),
        } as unknown as Event;
        const clickEvent = { type: 'click' } as Event;

        guard(touchEvent, action);
        guard(clickEvent, action);

        expect(action).toHaveBeenCalledTimes(1);
        expect(touchEvent.preventDefault).toHaveBeenCalled();
    });

    it('allows subsequent mouse clicks after touch cycle', async () => {
        const guard = createTouchClickGuard();
        const action = vi.fn();

        guard({ type: 'touchstart', preventDefault: () => {} } as Event, action);
        guard({ type: 'click' } as Event, action);
        guard({ type: 'click' } as Event, action);

        expect(action).toHaveBeenCalledTimes(2);
    });
});
