import { describe, expect, it } from 'vitest';

import { ACHIEVEMENTS } from '../frontend/src/utils/achievements.js';
import { TITLES } from '../frontend/src/utils/titles.js';

describe('achievements catalog', () => {
  it('ships a v3-sized achievement set with fewer prestige titles', () => {
    expect(ACHIEVEMENTS).toHaveLength(20);
    expect(TITLES.length).toBeLessThan(ACHIEVEMENTS.length);
    expect(TITLES).toHaveLength(5);
  });
});
