import { describe, it, expect } from 'vitest';
import { togglePreviewId } from '../frontend/src/utils/preview.js';

describe('togglePreviewId', () => {
  it('sets id when none is active', () => {
    expect(togglePreviewId(null, 'a')).toBe('a');
  });
  it('clears id when same id provided', () => {
    expect(togglePreviewId('a', 'a')).toBeNull();
  });
  it('switches to new id when different id provided', () => {
    expect(togglePreviewId('a', 'b')).toBe('b');
  });
});
