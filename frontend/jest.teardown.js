/**
 * This file runs after Jest tests complete
 */

module.exports = async () => {
    try {
        console.log(
            'Tests completed - dedicated test directories will store artifacts automatically'
        );
    } catch (error) {
        console.error('Error in teardown process:', error);
    }
};
