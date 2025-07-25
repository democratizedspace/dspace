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
  "goldfish": 10,
  "ev_charger": 500,
  "battery_pack_1kwh": 1000,
  "solar_panel_200w": 200,
  "m2_poe_hat": 25,
  "ssd_1tb": 120
};

export function approximateIrlPrice(id: string): number | null {
  return priceTable[id] ?? null;
}
