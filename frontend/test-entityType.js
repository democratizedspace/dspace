// Simple test script for getStoreForEntityType function
const path = require('path');
const fs = require('fs');

// Extract the getStoreForEntityType function from the original module
function getStoreForEntityType(entityType) {
    switch (entityType) {
        case 'quest':
            return 'quests';
        case 'item':
            return 'items';
        case 'process':
            return 'processes';
        default:
            throw new Error(`Unknown entity type: ${entityType}`);
    }
}

// Simple test function
function testGetStoreForEntityType() {
    const testCases = [
        { input: 'quest', expected: 'quests' },
        { input: 'item', expected: 'items' },
        { input: 'process', expected: 'processes' },
    ];

    let allPassed = true;

    testCases.forEach((test) => {
        const result = getStoreForEntityType(test.input);
        const passed = result === test.expected;

        console.log(`Testing ${test.input}:`);
        console.log(`  Expected: ${test.expected}`);
        console.log(`  Result:   ${result}`);
        console.log(`  ${passed ? 'PASSED' : 'FAILED'}`);

        if (!passed) allPassed = false;
    });

    // Test error case
    try {
        getStoreForEntityType('unknown');
        console.log('Testing error case: FAILED - should have thrown an error');
        allPassed = false;
    } catch (error) {
        console.log(`Testing error case: PASSED - correctly threw error: ${error.message}`);
    }

    return allPassed;
}

// Run the test
const testResult = testGetStoreForEntityType();
console.log(`\nOverall test result: ${testResult ? 'PASSED' : 'FAILED'}`);

// Exit with appropriate code
process.exit(testResult ? 0 : 1);
