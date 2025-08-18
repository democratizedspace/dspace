import { bench } from 'vitest';
import { listMissingImages } from '../utils/fs-checks';

const images = Array.from({ length: 1000 }, (_, i) => `missing-${i}.png`);

bench('listMissingImages 1k missing images', () => {
  listMissingImages(images, '/tmp');
});
