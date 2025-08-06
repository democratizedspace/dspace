import { describe, expect, test } from 'vitest';

const { hasZeroTests } = require('../utils/detect-zero-tests');

describe('hasZeroTests', () => {
  test('detects when no tests run', () => {
    const output = 'Test Files  0 passed\nTests  0 passed';
    expect(hasZeroTests(output)).toBe(true);
  });

  test('does not trigger when tests are present', () => {
    const output = 'Test Files  1 passed\nTests  5 passed';
    expect(hasZeroTests(output)).toBe(false);
  });

  test('detects when vitest reports no test files found', () => {
    const output = 'No test files found, exiting with code 0';
    expect(hasZeroTests(output)).toBe(true);
  });
});
