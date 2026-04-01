import { describe, expect, test } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { listMissingImages } from '../scripts/utils/fs-checks';

describe('listMissingImages', () => {
  test('handles invalid percent-encoded paths safely', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'images-'));
    try {
      const images = ['bad%2Gname.png'];
      const missing = listMissingImages(images, tmp);
      expect(missing).toEqual(['bad%2Gname.png']);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
