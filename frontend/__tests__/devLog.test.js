/**
 * @jest-environment node
 */
const { log } = require('../src/utils/devLog.js');

describe('devLog', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
        console.log = jest.fn();
    });

    afterEach(() => {
        process.env.NODE_ENV = originalEnv;
    });

    test('logs when NODE_ENV is development', () => {
        process.env.NODE_ENV = 'development';
        log('hello', 'world');
        expect(console.log).toHaveBeenCalledWith('hello', 'world');
    });

    test('does not log when NODE_ENV is not development', () => {
        process.env.NODE_ENV = 'production';
        log('hi');
        expect(console.log).not.toHaveBeenCalled();
    });
});
