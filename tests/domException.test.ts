import { describe, it, expect } from 'vitest';

describe('DOMException', () => {
  it('uses the built-in DOMException', () => {
    const err = new DOMException('boom');
    expect(err).toBeInstanceOf(DOMException);
    expect(err.message).toBe('boom');
  });
});
