const priceTable: Record<string, number> = {
  "3d_printer": 350,
  "arduino_nano": 22,
  "raspberry_pi_5": 80,
  "arduino_uno": 27,
  "breadboard": 10,
  "jumper_wires": 5,
  "led": 1,
  "resistor_220_ohm": 0.02,
  "usb_cable": 5,
  "servo_motor": 15,
  "potentiometer": 1,
  "3d_printed_phone_stand": 2,
  "thermometer": 15,
  "hydroponics_kit": 60,
  "aquarium_150l": 60,
  "goldfish": 5,
  "ev_charger": 500,
  "battery_pack_1kwh": 1000,
  "solar_panel_200w": 200,
  "m2_poe_hat": 25,
  "ssd_1tb": 120,
};

const aliasTable: Record<string, string> = {
  rpi5: "raspberry_pi_5",
};

const NORMALIZE_REGEX = /[\s-]+/g;

function normalizeId(id: string): string {
  return id.trim().toLowerCase().replace(NORMALIZE_REGEX, '_');
}

/**
 * Look up a real‑world price for a game item.
 *
 * The lookup is case‑insensitive, trims surrounding whitespace, and normalizes
 * spaces or hyphens to underscores so callers can pass identifiers like
 * `3D-Printer`, `3d printer`, or even ` 3d_printer `.
 *
 * Common aliases are supported. For example, `rpi5` resolves to `raspberry_pi_5`.
*/
export function approximateIrlPrice(id: string | null | undefined): number | null {
  if (typeof id !== 'string') {
    return null;
  }
  let normalized = normalizeId(id);
  const alias = aliasTable[normalized];
  if (alias) {
    normalized = alias;
  }
  return priceTable[normalized] ?? null;
}
