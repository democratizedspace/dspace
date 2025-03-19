// Mock FormData for tests
class MockFormData {
  constructor() {
    this.data = {};
  }

  append(key, value) {
    this.data[key] = value;
  }

  get(key) {
    return this.data[key] || null;
  }

  has(key) {
    return this.data.hasOwnProperty(key);
  }

  delete(key) {
    delete this.data[key];
  }

  getAll(key) {
    return this.data[key] ? [this.data[key]] : [];
  }

  set(key, value) {
    this.data[key] = value;
  }

  entries() {
    return Object.entries(this.data);
  }

  keys() {
    return Object.keys(this.data);
  }

  values() {
    return Object.values(this.data);
  }
}

// Override FormData in global scope
global.FormData = MockFormData;

module.exports = MockFormData; 