import { describe, expect, test } from 'vitest';
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
});
