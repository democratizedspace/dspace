import { readFileSync } from 'fs';

const priceTable: Record<string, number> = {
  '3d_printer': 350,
  arduino_nano: 22,
  raspberry_pi_5: 80,
  arduino_uno: 27,
  breadboard: 10,
  jumper_wires: 5,
  led: 1,
  resistor_220_ohm: 0.02,
  usb_cable: 5,
  servo_motor: 15,
  potentiometer: 1,
  '3d_printed_phone_stand': 2,
  thermometer: 15,
  hydroponics_kit: 60,
  aquarium_150l: 60,
  goldfish: 5,
  ev_charger: 500,
  battery_pack_1kwh: 1000,
  solar_panel_200w: 200,
  m2_poe_hat: 25,
  ssd_1tb: 120,
};

const NORMALIZE_REGEX = /[\s-]+/g;

function normalizeId(id: string): string {
  return id.trim().toLowerCase().replace(NORMALIZE_REGEX, '_');
}

let customTable: Record<string, number> | null = null;
let mergedTable: Record<string, number> | null = null;

function loadCustomTable(): Record<string, number> {
  if (!customTable) {
    customTable = {};
    const file = process.env.DSPACE_PRICE_TABLE_FILE;
    if (file) {
      try {
        const data = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
        for (const [key, value] of Object.entries(data)) {
          if (typeof value === 'number') {
            customTable[normalizeId(key)] = value;
          }
        }
      } catch {
        // ignore invalid file
      }
    }
  }
  return customTable;
}

function getPriceTable(): Record<string, number> {
  if (!mergedTable) {
    mergedTable = { ...priceTable, ...loadCustomTable() };
  }
  return mergedTable;
}

export function __resetPriceTableCacheForTests(options?: {
  keepCustom?: boolean;
}): void {
  if (!options?.keepCustom) {
    customTable = null;
  }
  mergedTable = null;
}

/**
 * Look up a real‑world price for a game item.
 *
 * The lookup is case‑insensitive, trims surrounding whitespace, and normalizes
 * spaces or hyphens to underscores so callers can pass identifiers like
 * `3D-Printer`, `3d printer`, or even ` 3d_printer `.
 */
export function approximateIrlPrice(
  id: string | null | undefined
): number | null {
  if (typeof id !== 'string') {
    return null;
  }
  const normalized = normalizeId(id);
  return getPriceTable()[normalized] ?? null;
}

/**
 * Sum the prices of multiple game items.
 *
 * Unknown or non-string identifiers are ignored. Returns `null` when no known
 * items are provided.
 */
export function approximateIrlTotalPrice(
  ids: Array<string | null | undefined> | null | undefined
): number | null {
  if (!Array.isArray(ids)) {
    return null;
  }

  let total = 0;
  let count = 0;

  for (const id of ids) {
    const price = approximateIrlPrice(id);
    if (typeof price === 'number') {
      total += price;
      count++;
    }
  }

  return count > 0 ? total : null;
}

/**
 * Average the prices of multiple game items.
 *
 * Unknown or non-string identifiers are ignored. Returns `null` when no known
 * items are provided.
 */
export function approximateIrlAveragePrice(
  ids: Array<string | null | undefined> | null | undefined
): number | null {
  if (!Array.isArray(ids)) {
    return null;
  }

  let total = 0;
  let count = 0;

  for (const id of ids) {
    const price = approximateIrlPrice(id);
    if (typeof price === 'number') {
      total += price;
      count++;
    }
  }

  return count > 0 ? total / count : null;
}
