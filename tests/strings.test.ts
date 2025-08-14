import { describe, expect, test } from 'vitest';
import {
  getDurationString,
  getDuration,
} from '../frontend/src/utils/strings.js';

describe('getDurationString', () => {
  test('includes remaining time when duration below 100', () => {
    expect(getDurationString(75.1234, '5s')).toBe('75.12% - 5s');
  });

  test('omits remaining time when duration is 100', () => {
    expect(getDurationString(100, '0s')).toBe('100.00%');
  });

  test('handles missing remaining time gracefully', () => {
    expect(getDurationString(50, undefined)).toBe('50.00%');
  });
});

describe('getDuration', () => {
  test('formats to two decimals with percent', () => {
    expect(getDuration(3)).toBe('3.00%');
  });
});
