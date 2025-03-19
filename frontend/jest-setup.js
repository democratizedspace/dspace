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

// Mock process.env for devLog.js
if (typeof process === 'undefined') {
    global.process = {
        env: {
            NODE_ENV: 'test'
        }
    };
} 