const ANSI_REGEX = /\x1B\[[0-9;]*m/g;
const ZERO_TEST_PATTERNS = [/No test files? found/i];

const FALLBACK_ZERO_PATTERN =
  /(Test Files|Tests)\s+0\s+passed(?![^\n]*\()/gi;

function getLastTotals(clean, label) {
  const regex = new RegExp(`${label}\\s+(\\d+)[^\n]*\\((\\d+)\\)`, 'gi');
  let match;
  let last = null;
  while ((match = regex.exec(clean)) !== null) {
    const [, executed, total] = match;
    last = { executed: Number(executed), total: Number(total) };
  }
  return last;
}

function hasZeroTests(output) {
  // Strip ANSI color codes to ensure regex detection works with colored output
  const clean = output.replace(ANSI_REGEX, '');

  const totals = [
    getLastTotals(clean, 'Test Files'),
    getLastTotals(clean, 'Tests')
  ].filter(Boolean);

  if (totals.length > 0) {
    const last = totals[totals.length - 1];
    if (last.total > 0) {
      return false;
    }
    return last.total === 0;
  }

  const fallbackMatches = clean.match(FALLBACK_ZERO_PATTERN) || [];
  if (fallbackMatches.length >= 2) {
    return true;
  }

  return ZERO_TEST_PATTERNS.some((pattern) => pattern.test(clean));
}

module.exports = { hasZeroTests };
