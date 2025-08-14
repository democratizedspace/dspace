import { describe, it, expect } from 'vitest'
import { approximateIrlPrice } from './approximateIrlPrice'

describe('approximateIrlPrice', () => {
  it('returns price for known item', () => {
    expect(approximateIrlPrice('3d_printer')).toBe(350)
  })

  it('handles case and separator variations', () => {
    expect(approximateIrlPrice('3D-Printer')).toBe(350)
  })

  it('trims leading and trailing whitespace', () => {
    expect(approximateIrlPrice(' 3d printer ')).toBe(350)
  })

  it('returns null for unknown item', () => {
    expect(approximateIrlPrice('nonexistent')).toBeNull()
  })

  it('matches items whose canonical IDs lack underscores', () => {
    expect(approximateIrlPrice('gold fish')).toBe(5)
    expect(approximateIrlPrice('gold-fish')).toBe(5)
    expect(approximateIrlPrice('gold_fish')).toBe(5)
  })
})
