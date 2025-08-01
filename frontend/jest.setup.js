// Import necessary modules using ESM syntax for Node 20
import { TextEncoder, TextDecoder } from 'util';
import crypto from 'crypto';

if (typeof globalThis.crypto === 'undefined') {
    globalThis.crypto = crypto.webcrypto || {
        getRandomValues: (arr) => crypto.randomFillSync(arr),
    };
}

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

// Use a safe jest.fn wrapper when Jest isn't available
const safeJestFn =
    typeof jest !== 'undefined'
        ? jest.fn
        : () => {
              const fn = () => {};
              fn.mockImplementation = () => fn;
              return fn;
          };

// Define a function to create realistic DOM elements
const createDomElement = (tag) => {
    const element = {
        tagName: tag.toUpperCase(),
        nodeType: 1,
        ownerDocument: global.document,
        toString: () => tag,
        getAttribute: safeJestFn(),
        setAttribute: safeJestFn(),
        removeAttribute: safeJestFn(),
        classList: {
            add: safeJestFn(),
            remove: safeJestFn(),
            contains: safeJestFn(),
            toggle: safeJestFn(),
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
        addEventListener: safeJestFn(),
        removeEventListener: safeJestFn(),
        dispatchEvent: safeJestFn(),
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
    createElement: safeJestFn().mockImplementation((tag) => createDomElement(tag)),
    createElementNS: safeJestFn().mockImplementation((ns, tag) => createDomElement(tag)),
    createTextNode: safeJestFn().mockImplementation((text) => ({
        nodeType: 3,
        textContent: text,
        nodeValue: text,
    })),
    querySelector: safeJestFn().mockImplementation((selector) => {
        if (selector === '#app') {
            return createDomElement('div');
        }
        return document.body.querySelector(selector);
    }),
    querySelectorAll: safeJestFn().mockImplementation((selector) => {
        return document.body.querySelectorAll(selector);
    }),
    getElementById: safeJestFn().mockImplementation((id) => {
        return document.body.querySelector(`#${id}`);
    }),
    dispatchEvent: safeJestFn(),
    createComment: safeJestFn(),
    head: createDomElement('head'),
};

// Setup JSDOM environment
global.window = {
    location: {
        href: 'http://localhost:3000/',
    },
    navigator: {
        userAgent: 'node.js',
    },
    dispatchEvent: safeJestFn(),
    document: global.document,
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
    getItem: safeJestFn(),
    setItem: safeJestFn(),
    removeItem: safeJestFn(),
    clear: safeJestFn(),
};

global.sessionStorage = {
    getItem: safeJestFn(),
    setItem: safeJestFn(),
    removeItem: safeJestFn(),
    clear: safeJestFn(),
};

// Mock IndexedDB
global.indexedDB = {
    open: safeJestFn().mockImplementation(() => ({
        onupgradeneeded: null,
        onsuccess: null,
        onerror: null,
    })),
};

// Define a mock EventTarget that's safe to use in jest.mock
const mockEventTarget = {
    addEventListener: safeJestFn(),
    removeEventListener: safeJestFn(),
    dispatchEvent: safeJestFn(),
};

// Svelte mocks
if (typeof jest !== 'undefined') {
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
}

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

global.fetch = safeJestFn().mockImplementation(() =>
    Promise.resolve({
        ok: true,
        text: () => Promise.resolve(''),
        json: () => Promise.resolve({}),
        blob: () => Promise.resolve(new Blob()),
    })
);
