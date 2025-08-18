import { describe, it, expect } from 'vitest';
import {
  approximateIrlPrice,
  approximateIrlTotalPrice,
} from './approximateIrlPrice';

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
});
