import { bench, describe } from 'vitest';
import { listMissingImages } from './fs-checks.js';

const images = Array.from({ length: 100 }, (_, i) => `/img-${i}.png`);

describe('listMissingImages benchmark', () => {
  bench('process 100 images', () => {
    listMissingImages(images, __dirname);
  });
});

