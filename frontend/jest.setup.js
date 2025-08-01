// Import necessary modules
const { TextEncoder, TextDecoder } = require('util');
const crypto = require('crypto');

// Add polyfills for TextEncoder and TextDecoder if they're not defined
if (typeof TextEncoder === 'undefined') {
    global.TextEncoder = TextEncoder;
}
if (typeof TextDecoder === 'undefined') {
    global.TextDecoder = TextDecoder;
}

// Add setImmediate polyfill for fake-indexeddb
if (typeof setImmediate === 'undefined') {
    global.setImmediate = (callback, ...args) => {
        return setTimeout(callback, 0, ...args);
    };
}

if (typeof clearImmediate === 'undefined') {
    global.clearImmediate = (id) => {
        return clearTimeout(id);
    };
}

// Add structuredClone polyfill for fake-indexeddb
if (typeof structuredClone === 'undefined') {
    global.structuredClone = (obj) => {
        try {
            return JSON.parse(JSON.stringify(obj));
        } catch (e) {
            // Fallback for non-serializable objects
            return obj;
        }
    };
}

// Set SSR and browser flags
global.__SSR__ = false;
global.__BROWSER__ = true;

// Setup JSDOM environment
global.window = {
    location: {
        href: 'http://localhost:3000/',
    },
    crypto: {
        getRandomValues: (arr) => crypto.randomFillSync(arr),
    },
    navigator: {
        userAgent: 'node.js',
    },
    dispatchEvent: jest.fn(),
};

// Define CustomEvent
class MockCustomEvent {
    constructor(type, options = {}) {
        this.type = type;
        this.detail = options.detail || null;
    }
}
global.CustomEvent = MockCustomEvent;
global.Event = function (type) {
    this.type = type;
};

// Define a function to create realistic DOM elements
const createDomElement = (tag) => {
    const element = {
        tagName: tag.toUpperCase(),
        nodeType: 1,
        ownerDocument: global.document,
        toString: () => tag,
        getAttribute: jest.fn(),
        setAttribute: jest.fn(),
        removeAttribute: jest.fn(),
        classList: {
            add: jest.fn(),
            remove: jest.fn(),
            contains: jest.fn(),
            toggle: jest.fn(),
        },
        style: {},
        children: [],
        childNodes: [],
        appendChild: function (child) {
            this.children.push(child);
            this.childNodes.push(child);
            child.parentNode = this;
            return child;
        },
        removeChild: function (child) {
            const index = this.children.indexOf(child);
            if (index !== -1) {
                this.children.splice(index, 1);
                this.childNodes.splice(index, 1);
            }
            return child;
        },
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
        innerHTML: '',
        textContent: '',
        id: '',
        querySelector: function (selector) {
            // Simple selector handling for common cases
            if (selector.startsWith('.')) {
                // Class selector
                const className = selector.slice(1);
                const matchingChild = this.children.find(
                    (child) =>
                        child.classList &&
                        child.classList.contains &&
                        child.classList.contains(className)
                );
                return matchingChild || null;
            } else if (selector.startsWith('#')) {
                // ID selector
                const id = selector.slice(1);
                const matchingChild = this.children.find((child) => child.id === id);
                return matchingChild || null;
            } else if (selector.includes('.')) {
                // Element with class selector (e.g., 'img.logo')
                const [tagName, className] = selector.split('.');
                const matchingChild = this.children.find(
                    (child) =>
                        child.tagName === tagName.toUpperCase() &&
                        child.classList &&
                        child.classList.contains &&
                        child.classList.contains(className)
                );
                return matchingChild || null;
            } else {
                // Tag selector
                const matchingChild = this.children.find(
                    (child) => child.tagName === selector.toUpperCase()
                );
                return matchingChild || null;
            }
        },
        querySelectorAll: function (selector) {
            // Simple implementation that matches classes
            if (selector.startsWith('.')) {
                const className = selector.slice(1);
                return this.children.filter(
                    (child) =>
                        child.classList &&
                        child.classList.contains &&
                        child.classList.contains(className)
                );
            } else if (selector.includes('.')) {
                const [tagName, className] = selector.split('.');
                return this.children.filter(
                    (child) =>
                        child.tagName === tagName.toUpperCase() &&
                        child.classList &&
                        child.classList.contains &&
                        child.classList.contains(className)
                );
            } else {
                return this.children.filter((child) => child.tagName === selector.toUpperCase());
            }
        },
    };

    // Add specific properties based on tag
    if (tag === 'img') {
        element.src = '';
        element.alt = '';
    } else if (tag === 'input') {
        element.type = 'text';
        element.value = '';
        element.checked = false;
    } else if (tag === 'a') {
        element.href = '';
    }

    return element;
};

// Define document with enhanced methods
global.document = {
    body: createDomElement('body'),
    documentElement: createDomElement('html'),
    createElement: jest.fn().mockImplementation((tag) => createDomElement(tag)),
    createElementNS: jest.fn().mockImplementation((ns, tag) => createDomElement(tag)),
    createTextNode: jest.fn().mockImplementation((text) => ({
        nodeType: 3,
        textContent: text,
        nodeValue: text,
    })),
    querySelector: jest.fn().mockImplementation((selector) => {
        if (selector === '#app') {
            return createDomElement('div');
        }
        return document.body.querySelector(selector);
    }),
    querySelectorAll: jest.fn().mockImplementation((selector) => {
        return document.body.querySelectorAll(selector);
    }),
    getElementById: jest.fn().mockImplementation((id) => {
        return document.body.querySelector(`#${id}`);
    }),
    dispatchEvent: jest.fn(),
    createComment: jest.fn(),
    head: createDomElement('head'),
};

// Make document.body accessible on window
window.document = global.document;

// Define necessary HTML elements
global.Element = function () {};
global.HTMLElement = function () {};
global.HTMLDivElement = function () {};
global.HTMLSpanElement = function () {};
global.HTMLInputElement = function () {};
global.HTMLButtonElement = function () {};
global.HTMLSelectElement = function () {};
global.HTMLTextAreaElement = function () {};
global.HTMLImageElement = function () {};
global.Node = function () {};

// Mock localStorage
global.localStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};

global.sessionStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};

// Mock IndexedDB
global.indexedDB = {
    open: jest.fn().mockImplementation(() => ({
        onupgradeneeded: null,
        onsuccess: null,
        onerror: null,
    })),
};

// Define a mock EventTarget that's safe to use in jest.mock
const mockEventTarget = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
};

// Svelte mocks
jest.mock('svelte/internal', () => {
    return {
        dispatch_dev: function (type, detail) {
            try {
                // Extremely simplified implementation that doesn't reference any external variables
                mockEventTarget.dispatchEvent({ type, detail });
            } catch (error) {
                console.warn('Error in dispatch_dev:', error);
            }
        },
        globals: { Error },
        validate_component: jest.fn(),
        validate_slots: jest.fn(),
        validate_store: jest.fn(),
        insert: jest.fn(),
        noop: () => {},
        SvelteComponentDev: class SvelteComponentDev {
            constructor(options) {
                this.$$set = () => {};
                this.$$prop_def = {};
                this.$$slot_def = {};
                this.$$root = null;
            }
            $destroy() {}
            $on() {}
        },
    };
});

// These help to make testing environment closer to browser
window.requestAnimationFrame = function (callback) {
    return setTimeout(callback, 0);
};

window.cancelAnimationFrame = function (id) {
    clearTimeout(id);
};

global.DOMParser = class DOMParser {
    parseFromString(string, contentType) {
        return {
            body: {},
            documentElement: {},
        };
    }
};

// Define a Blob constructor
global.Blob = class Blob {
    constructor(parts, options) {
        this.parts = parts;
        this.options = options;
        this.size = parts.reduce((acc, part) => acc + (part.length || 0), 0);
        this.type = options?.type || '';
    }
};

global.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
        ok: true,
        text: () => Promise.resolve(''),
        json: () => Promise.resolve({}),
        blob: () => Promise.resolve(new Blob()),
    })
);
