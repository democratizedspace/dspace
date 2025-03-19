/**
 * This file runs after Jest tests complete
 */
const { execSync } = require('child_process');
const path = require('path');

module.exports = async () => {
    try {
        // Run our cleanup script
        const cleanupScript = path.join(__dirname, 'scripts', 'clean-test-artifacts.js');
        execSync(`node ${cleanupScript}`, { stdio: 'inherit' });
        console.log('Test artifacts cleaned up successfully');
    } catch (error) {
        console.error('Error cleaning up test artifacts:', error);
    }
}; 