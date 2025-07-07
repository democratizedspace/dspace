const fs = require('fs');
const path = require('path');
const { countLines } = require('../../scripts/generate-quest-chart.js');

describe('countLines', () => {
  const tmp = path.join(__dirname, 'temp.txt');
  afterEach(() => {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  });
  it('counts newline separated lines', () => {
    fs.writeFileSync(tmp, 'a\nb\nc\n');
    expect(countLines(tmp)).toBe(4);
  });
});
