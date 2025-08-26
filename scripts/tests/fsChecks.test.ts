import { describe, expect, test } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { listMissingImages } from '../utils/fs-checks';

describe('listMissingImages', () => {
  test('ignores query and hash in image paths', () => {
    const images = ['/assets/logo.png?v=1#hash'];
    const missing = listMissingImages(images);
    expect(missing).toEqual([]);
  });

  test('ignores remote URLs', () => {
    const images = ['https://example.com/remote.png'];
    const missing = listMissingImages(images);
    expect(missing).toEqual([]);
  });

  test('ignores data URLs', () => {
    const images = ['data:image/png;base64,AAAA'];
    const missing = listMissingImages(images);
    expect(missing).toEqual([]);
  });

  test('ignores protocol-relative URLs', () => {
    const images = ['//cdn.example.com/remote.png'];
    const missing = listMissingImages(images);
    expect(missing).toEqual([]);
  });

  test('resolves percent-encoded paths', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'images-'));
    try {
      const filename = 'encoded image.png';
      fs.writeFileSync(path.join(tmp, filename), '');
      const images = ['encoded%20image.png'];
      const missing = listMissingImages(images, tmp);
      expect(missing).toEqual([]);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('trims whitespace around paths', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'images-'));
    try {
      const filename = 'logo.png';
      fs.writeFileSync(path.join(tmp, filename), '');
      const images = [`  ${filename}  `];
      const missing = listMissingImages(images, tmp);
      expect(missing).toEqual([]);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
