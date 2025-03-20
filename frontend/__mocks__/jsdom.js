// This file is a pass-through to the real jsdom module to avoid issues with mocking
const originalJsdom = jest.requireActual('jsdom');
module.exports = originalJsdom; 