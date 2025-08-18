import { bench, describe } from 'vitest'
import { approximateIrlPrice } from './approximateIrlPrice'

describe('approximateIrlPrice benchmark', () => {
  bench('lookup base id', () => {
    approximateIrlPrice('3d_printer')
  })

  bench('lookup with normalization', () => {
    approximateIrlPrice(' 3D-Printer ')
  })
})
