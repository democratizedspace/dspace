// TextEncoder/TextDecoder polyfill
if (typeof global.TextEncoder === 'undefined') {
    const { TextEncoder, TextDecoder } = require('util');
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
}

// Set up JSDOM environment
const { JSDOM } = require('jsdom');

const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
    url: 'http://localhost',
    pretendToBeVisual: true,
});

// Set up browser globals
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Add any missing browser globals
global.Element = dom.window.Element;
global.HTMLElement = dom.window.HTMLElement;
global.CustomEvent = dom.window.CustomEvent;

// structuredClone polyfill
if (!global.structuredClone) {
    global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

// Mock IndexedDB
global.indexedDB = {
    open: jest.fn(),
    deleteDatabase: jest.fn(),
};

// Mock localStorage
global.localStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};
