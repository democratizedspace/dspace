// Mock browser environment for tests
if (typeof window === 'undefined') {
    global.window = {};
}

if (typeof document === 'undefined') {
    global.document = {
        createElement: () => ({
            style: {},
            setAttribute: () => {},
            className: '',
            id: '',
            append: () => {},
            parentNode: {
                removeChild: () => {}
            }
        }),
        getElementById: () => ({
            parentNode: {
                removeChild: () => {}
            },
            append: () => {}
        }),
        dispatchEvent: () => {}
    };
}

// Add TextEncoder and TextDecoder to the global scope
if (typeof TextEncoder === 'undefined') {
    global.TextEncoder = require('util').TextEncoder;
}

if (typeof TextDecoder === 'undefined') {
    global.TextDecoder = require('util').TextDecoder;
}

// Polyfill structuredClone
if (typeof structuredClone === 'undefined') {
    global.structuredClone = (obj) => {
        return JSON.parse(JSON.stringify(obj));
    };
}

// Mock process.env for devLog.js
if (typeof process === 'undefined') {
    global.process = {
        env: {
            NODE_ENV: 'test'
        }
    };
} 