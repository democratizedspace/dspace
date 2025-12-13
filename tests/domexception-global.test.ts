import { describe, it, expect } from 'vitest';

describe('DOMException', () => {
  it('is available globally', () => {
    const DOMExceptionCtor = (globalThis as any).DOMException;
    expect(typeof DOMExceptionCtor).toBe('function');
    expect(DOMExceptionCtor.name).toBe('DOMException');
    const err = new DOMExceptionCtor('boom');
    expect(err).toBeInstanceOf(DOMExceptionCtor);
  });
});
