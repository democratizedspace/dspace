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
  "ssd_1tb": 120
};

/**
 * Look up a real‑world price for a game item.
 *
 * The lookup trims surrounding whitespace, is case‑insensitive, and normalizes
 * spaces or hyphens to underscores so callers can pass identifiers like
 * `3D-Printer`, `3d printer`, or ` 3d_printer `.
 */
export function approximateIrlPrice(id: string): number | null {
  const normalized = id.trim().toLowerCase().replace(/[\s-]+/g, '_');
  return priceTable[normalized] ?? null;
}
