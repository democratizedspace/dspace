import { bench } from 'vitest';

const { hasZeroTests } = require('../utils/detect-zero-tests');

const output = 'Test Files  0 passed\nTests  0 passed';

bench('hasZeroTests on zero-test output', () => {
  hasZeroTests(output);
});
