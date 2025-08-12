function hasZeroTests(output) {
    // Strip ANSI color codes to ensure regex detection works with colored output
    const clean = output.replace(/\x1B\[[0-9;]*m/g, '');
    return (
        /Test Files\s+0\b/i.test(clean) ||
        /Tests\s+0\b/i.test(clean) ||
        /No test files? found/i.test(clean)
    );
}

module.exports = { hasZeroTests };
