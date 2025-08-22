import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  approximateIrlPrice,
  approximateIrlTotalPrice,
  approximateIrlAveragePrice,
  __resetPriceTableCacheForTests,
} from './approximateIrlPrice';
import { writeFileSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('approximateIrlPrice', () => {
  it('returns price for known item', () => {
    expect(approximateIrlPrice('3d_printer')).toBe(350);
  });

  it('handles case and separator variations', () => {
    expect(approximateIrlPrice('3D-Printer')).toBe(350);
  });

  it('trims leading and trailing whitespace', () => {
    expect(approximateIrlPrice(' 3d printer ')).toBe(350);
  });

  it('returns null for unknown item', () => {
    expect(approximateIrlPrice('nonexistent')).toBeNull();
  });

  it('returns null for non-string input', () => {
    expect(approximateIrlPrice(null as any)).toBeNull();
    expect(approximateIrlPrice(undefined as any)).toBeNull();
  });

  describe('custom price table', () => {
    let tmpFile: string;

    beforeEach(() => {
      tmpFile = join(mkdtempSync(join(tmpdir(), 'prices-')), 'prices.json');
      process.env.DSPACE_PRICE_TABLE_FILE = tmpFile;
      __resetPriceTableCacheForTests();
    });

    afterEach(() => {
      delete process.env.DSPACE_PRICE_TABLE_FILE;
      __resetPriceTableCacheForTests();
    });

    it('loads prices from a custom file', () => {
      writeFileSync(tmpFile, JSON.stringify({ custom_item: 42 }));
      expect(approximateIrlPrice('custom_item')).toBe(42);
    });

    it('ignores invalid JSON files', () => {
      writeFileSync(tmpFile, '{');
      expect(approximateIrlPrice('custom_item')).toBeNull();
    });

    it('caches prices without rereading file', () => {
      writeFileSync(tmpFile, JSON.stringify({ custom_item: 42 }));
      expect(approximateIrlPrice('custom_item')).toBe(42);
      writeFileSync(tmpFile, JSON.stringify({ custom_item: 99 }));
      __resetPriceTableCacheForTests({ keepCustom: true });
      expect(approximateIrlPrice('custom_item')).toBe(42);
    });
  });

  describe('approximateIrlTotalPrice', () => {
    it('sums prices of known items', () => {
      expect(approximateIrlTotalPrice(['3d_printer', 'arduino_nano'])).toBe(
        372
      );
    });

    it('ignores unknown items and returns null when none are known', () => {
      expect(approximateIrlTotalPrice(['nonexistent', '3d_printer'])).toBe(350);
      expect(approximateIrlTotalPrice(['foo'])).toBeNull();
    });

    it('returns null for non-array input', () => {
      expect(approximateIrlTotalPrice(null as any)).toBeNull();
      expect(approximateIrlTotalPrice(undefined as any)).toBeNull();
    });
  });

  describe('approximateIrlAveragePrice', () => {
    it('averages prices of known items', () => {
      expect(
        approximateIrlAveragePrice(['3d_printer', 'arduino_nano'])
      ).toBe(186);
    });

    it('ignores unknown items and returns null when none are known', () => {
      expect(
        approximateIrlAveragePrice(['nonexistent', 'arduino_nano'])
      ).toBe(22);
      expect(approximateIrlAveragePrice(['foo'])).toBeNull();
    });

    it('returns null for non-array input', () => {
      expect(approximateIrlAveragePrice(null as any)).toBeNull();
      expect(approximateIrlAveragePrice(undefined as any)).toBeNull();
    });
  });
});
