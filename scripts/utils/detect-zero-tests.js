function hasZeroTests(output) {
    return (
        /Test Files\s+0\b/i.test(output) ||
        /Tests\s+0\b/i.test(output) ||
        /No test files? found/i.test(output)
    );
}

module.exports = { hasZeroTests };
