import { describe, it, expect } from 'vitest'
import { approximateIrlPrice } from './approximateIrlPrice'

describe('approximateIrlPrice', () => {
  it('returns price for known item', () => {
    expect(approximateIrlPrice('3d_printer')).toBe(350)
  })

  it('returns null for unknown item', () => {
    expect(approximateIrlPrice('nonexistent')).toBeNull()
  })
})
