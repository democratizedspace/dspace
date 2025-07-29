/**
 * @jest-environment jsdom
 */
import { messages, countTokens } from '../src/stores/chat.js';

describe('messages store', () => {
    beforeEach(() => {
        messages.set([]);
    });

    test('starts empty', () => {
        let value;
        const unsub = messages.subscribe((v) => (value = v));
        unsub();
        expect(value).toEqual([]);
    });

    test('adds message with tokens', () => {
        const msg = { role: 'user', content: 'hello world', tokens: countTokens('hello world') };
        messages.update((m) => [...m, msg]);
        let value;
        const unsub = messages.subscribe((v) => (value = v));
        unsub();
        expect(value.length).toBe(1);
        expect(value[0].tokens).toBe(2);
    });
});
