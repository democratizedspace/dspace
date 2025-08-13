import { describe, it, expect } from 'vitest';
import { validateQuestData } from '../frontend/src/utils/customQuestValidation.js';

describe('custom quest schema validation', () => {
  it('rejects angle brackets in title', () => {
    const { valid, errors } = validateQuestData({
      title: '<tag>',
      description: 'long enough description',
      image: '/img.png',
      requiresQuests: []
    });
    expect(valid).toBe(false);
    expect(errors?.[0]?.instancePath).toBe('/title');
  });

  it('accepts valid quest data', () => {
    const { valid } = validateQuestData({
      title: 'My Quest',
      description: 'A valid description at least ten chars',
      image: '/img.png',
      requiresQuests: []
    });
    expect(valid).toBe(true);
  });
});
