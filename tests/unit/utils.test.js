const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { countLines } = require('../../scripts/generate-quest-chart.js');

test('counts newline separated lines', () => {
  const tmp = path.join(__dirname, 'temp.txt');
  fs.writeFileSync(tmp, 'a\nb\nc\n');
  try {
    assert.strictEqual(countLines(tmp), 4);
  } finally {
    fs.unlinkSync(tmp);
  }
});
