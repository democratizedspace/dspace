// This file is a pass-through to the real jsdom module to avoid issues with mocking
const { TextEncoder, TextDecoder } = require('util');

// Make TextEncoder and TextDecoder globally available for jsdom
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const originalJsdom = jest.requireActual('jsdom');
module.exports = originalJsdom; 