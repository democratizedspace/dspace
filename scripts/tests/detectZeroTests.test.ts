import { describe, expect, test } from 'vitest';

const { hasZeroTests } = require('../utils/detect-zero-tests');

describe('hasZeroTests', () => {
  test('detects when no tests run', () => {
    const output = 'Test Files  0 passed\nTests  0 passed';
    expect(hasZeroTests(output)).toBe(true);
  });

  test('detects zero tests when ANSI colors are present', () => {
    const output =
      '\u001b[32mTest Files\u001b[0m  \u001b[31m0\u001b[0m passed\n' +
      '\u001b[32mTests\u001b[0m  \u001b[31m0\u001b[0m passed';
    expect(hasZeroTests(output)).toBe(true);
  });

  test('does not trigger when tests are present', () => {
    const output = 'Test Files  1 passed\nTests  5 passed';
    expect(hasZeroTests(output)).toBe(false);
  });

  test('ignores interim vitest progress updates', () => {
    const output = `Test Files  0 passed (97)\nTests  0 passed (0)\nTest Files 97 passed (97)\nTests 643 passed (643)`;
    expect(hasZeroTests(output)).toBe(false);
  });

  test('detects when vitest reports no test files found', () => {
    const output = 'No test files found, exiting with code 0';
    expect(hasZeroTests(output)).toBe(true);
  });
});
