const ANSI_REGEX = /\x1B\[[0-9;]*m/g;
const ZERO_TEST_PATTERNS = [
  /Test Files\s+0\b/i,
  /Tests\s+0\b/i,
  /No test files? found/i
];

function hasZeroTests(output) {
  // Strip ANSI color codes to ensure regex detection works with colored output
  const clean = output.replace(ANSI_REGEX, '');
  return ZERO_TEST_PATTERNS.some((pattern) => pattern.test(clean));
}

module.exports = { hasZeroTests };
