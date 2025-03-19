// Mock for JSDOM
class JSDOM {
  constructor(html) {
    this.window = global.window;
    this.document = global.document;
  }
}

module.exports = { JSDOM }; 