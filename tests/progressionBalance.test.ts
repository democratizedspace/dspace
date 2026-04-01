import { checkProgressionBalance } from '../scripts/checkProgressionBalance.js';
import { expect, test } from 'vitest';

test('quest categories have balanced progression curves', () => {
    const diff = checkProgressionBalance();
    expect(diff).toBeLessThanOrEqual(7);
});
