import { bench } from 'vitest';
import { buildMap } from '../generate-item-dependencies';

bench('generate item dependencies map', () => {
  buildMap();
}, { iterations: 1 });
