import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';
const validateItem = require('../validate-item');

describe('validateItem script', () => {
  it('returns true for a valid item file', () => {
    const tempPath = path.join(__dirname, 'temp-item.json');
    const item = { id: '1', name: 'test', description: 'ok item', image: 'foo.jpg' };
    fs.writeFileSync(tempPath, JSON.stringify(item));
    expect(validateItem(tempPath)).toBe(true);
    fs.unlinkSync(tempPath);
  });

  it('returns false for an invalid item file', () => {
    const tempPath = path.join(__dirname, 'temp-invalid-item.json');
    fs.writeFileSync(tempPath, JSON.stringify({ name: 'bad' }));
    const result = validateItem(tempPath);
    fs.unlinkSync(tempPath);
    expect(result).toBe(false);
  });
});
