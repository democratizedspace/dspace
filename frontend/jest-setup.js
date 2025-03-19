// Mock browser environment for tests
if (typeof window === 'undefined') {
    global.window = {
        location: {
            href: 'http://localhost/'
        },
        localStorage: {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn()
        },
        sessionStorage: {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn()
        },
        fetch: jest.fn(() => Promise.resolve({
            json: () => Promise.resolve({}),
            text: () => Promise.resolve(''),
            blob: () => Promise.resolve(new Blob()),
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
            formData: () => Promise.resolve(new FormData()),
            headers: new Headers()
        })),
        atob: (str) => Buffer.from(str, 'base64').toString('binary'),
        btoa: (str) => Buffer.from(str, 'binary').toString('base64')
    };
}

if (typeof document === 'undefined') {
    global.document = {
        createElement: (tag) => ({
            style: {},
            setAttribute: jest.fn(),
            className: '',
            id: '',
            append: jest.fn(),
            parentNode: {
                removeChild: jest.fn()
            },
            tag
        }),
        getElementById: (id) => ({
            parentNode: {
                removeChild: jest.fn()
            },
            append: jest.fn(),
            id
        }),
        dispatchEvent: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        querySelector: jest.fn(),
        querySelectorAll: jest.fn(() => [])
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

// Mock Node.js Buffer for browser
if (typeof Buffer === 'undefined') {
    global.Buffer = {
        from: jest.fn((data, encoding) => ({
            toString: jest.fn(() => data)
        }))
    };
}

// Mock Fetch API
global.Headers = class Headers {
    constructor() { this.headers = {}; }
    append(key, value) { this.headers[key] = value; }
    get(key) { return this.headers[key]; }
};

global.FormData = class FormData {
    constructor() { this.data = {}; }
    append(key, value) { this.data[key] = value; }
};

global.Blob = class Blob {
    constructor(parts, options = {}) { 
        this.parts = parts || [];
        this.options = options;
        this.size = 0;
        this.type = options.type || '';
    }
};

// Mock process.env for devLog.js
if (typeof process === 'undefined') {
    global.process = {
        env: {
            NODE_ENV: 'test'
        }
    };
}

// Setup Jest globals
global.jest = jest; 