import { describe, it, expect } from 'vitest';

describe('chat personas store', () => {
    it('defaults to dChat and allows switching personas', async () => {
        const chatStore = await import('../frontend/src/stores/chat.js');
        const personaOptions = chatStore.personaOptions as Array<{ id: string }>;
        expect(Array.isArray(personaOptions)).toBe(true);
        expect(personaOptions.some((p) => p.id === 'dchat')).toBe(true);
        expect(personaOptions.some((p) => p.id !== 'dchat')).toBe(true);

        const activePersonaStore = chatStore.activePersona as any;
        let current;
        const unsubscribe = activePersonaStore.subscribe((value) => {
            current = value;
        });
        unsubscribe();
        expect(current?.id).toBe('dchat');

        chatStore.setActivePersona?.('sydney');
        const unsubscribeAfter = activePersonaStore.subscribe((value) => {
            current = value;
        });
        unsubscribeAfter();
        expect(current?.id).toBe('sydney');
    });
});
