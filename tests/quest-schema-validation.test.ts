import { expect, test } from 'vitest';
import { validateQuestData } from '../frontend/src/utils/customQuestValidation.js';

test('validateQuestData flags HTML tags in title', () => {
  const result = validateQuestData({
    title: '<b>Bad</b>',
    description: 'Valid description for quest.',
    image: 'https://example.com/img.png',
  });
  expect(result.valid).toBe(false);
  expect(result.errors.title).toMatch(/HTML tags/);
});
