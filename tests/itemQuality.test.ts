import { describe, it, expect } from "vitest";
import items from "../frontend/src/pages/inventory/json/items";
import { approximateIrlPrice } from "../backend/approximateIrlPrice";

enum PriceExemptionReason {
  TROPHY = "TROPHY",
  SOULBOUND = "SOULBOUND",
  EVENT_REWARD = "EVENT_REWARD",
  CURRENCY = "CURRENCY",
  COMPONENT = "COMPONENT",
  BETA_PLACEHOLDER = "BETA_PLACEHOLDER",
  ALIEN_TECH = "ALIEN_TECH",
}

describe("item quality", () => {
  it("has either a price or exemption reason", () => {
    for (const item of items as Array<Record<string, any>>) {
      const priceStr: string | undefined = item.price;
      const exemption: string | undefined = item.priceExemptionReason;

      if (priceStr) {
        const match = priceStr.match(/([0-9.]+)/);
        const price = match ? parseFloat(match[1]) : NaN;
        expect(price).toBeGreaterThan(0);

        const anchor = approximateIrlPrice(item.id);
        if (anchor !== null) {
          const min = anchor * 0.5;
          const max = anchor * 1.5;
          expect(price).toBeGreaterThanOrEqual(min);
          expect(price).toBeLessThanOrEqual(max);
        }
      } else {
        expect(exemption).toBeDefined();
        expect(Object.values(PriceExemptionReason)).toContain(exemption);
      }
    }
  });

  it("prices the CPR pocket mask instead of using a beta placeholder", () => {
    const cprMask = (items as Array<Record<string, any>>).find(
      (item) => item.name === "CPR pocket mask"
    );

    expect(cprMask).toBeDefined();
    expect(cprMask?.price).toBeDefined();
    expect(cprMask?.price).toMatch(/[0-9]/);
    expect(cprMask?.priceExemptionReason ?? null).not.toBe(
      PriceExemptionReason.BETA_PLACEHOLDER
    );
  });

  it("prices the harvested basil plant instead of using a beta placeholder", () => {
    const basilPlant = (items as Array<Record<string, any>>).find(
      (item) => item.name === "harvested basil plant"
    );

    expect(basilPlant).toBeDefined();
    expect(basilPlant?.price).toBeDefined();
    expect(basilPlant?.price).toMatch(/[0-9]/);
    expect(basilPlant?.priceExemptionReason ?? null).not.toBe(
      PriceExemptionReason.BETA_PLACEHOLDER
    );
  });

  it("prices the nutrient-deficient hydroponics tub instead of using a beta placeholder", () => {
    const nutrientDeficientTub = (items as Array<Record<string, any>>).find(
      (item) => item.name === "hydroponics tub (nutrient deficient)"
    );

    expect(nutrientDeficientTub).toBeDefined();
    expect(nutrientDeficientTub?.price).toBeDefined();
    expect(nutrientDeficientTub?.price).toMatch(/[0-9]/);
    expect(nutrientDeficientTub?.priceExemptionReason ?? null).not.toBe(
      PriceExemptionReason.BETA_PLACEHOLDER
    );
  });

  it("prices the first aid kit instead of using a beta placeholder", () => {
    const firstAidKit = (items as Array<Record<string, any>>).find(
      (item) => item.name === "first aid kit"
    );

    expect(firstAidKit).toBeDefined();
    expect(firstAidKit?.price).toBeDefined();
    expect(firstAidKit?.price).toMatch(/[0-9]/);
    expect(firstAidKit?.priceExemptionReason ?? null).not.toBe(
      PriceExemptionReason.BETA_PLACEHOLDER
    );
  });

  it("treats in-game currency tokens as currency instead of beta placeholders", () => {
    const currencyItems = ["dCarbon", "dWatt", "dUSD"];

    for (const name of currencyItems) {
      const currencyItem = (items as Array<Record<string, any>>).find(
        (item) => item.name === name
      );

      expect(currencyItem).toBeDefined();
      expect(currencyItem?.priceExemptionReason).toBe(PriceExemptionReason.CURRENCY);
      expect(currencyItem?.price).toBeUndefined();
    }
  });

  it("prices the Hypercar (80% charge) instead of using a beta placeholder", () => {
    const hypercar = (items as Array<Record<string, any>>).find(
      (item) => item.name === "Hypercar (80% charge)"
    );

    expect(hypercar).toBeDefined();
    expect(hypercar?.price).toBeDefined();
    expect(hypercar?.price).toMatch(/[0-9]/);
    expect(hypercar?.priceExemptionReason ?? null).not.toBe(
      PriceExemptionReason.BETA_PLACEHOLDER
    );
  });

  it("prices antiseptic wipes instead of using a beta placeholder", () => {
    const antisepticWipes = (items as Array<Record<string, any>>).find(
      (item) => item.name === "antiseptic wipes"
    );

    expect(antisepticWipes).toBeDefined();
    expect(antisepticWipes?.price).toBeDefined();
    expect(antisepticWipes?.price).toMatch(/[0-9]/);
    expect(antisepticWipes?.priceExemptionReason ?? null).not.toBe(
      PriceExemptionReason.BETA_PLACEHOLDER
    );
  });

  it("prices the soaked hydroponic starter plug instead of using a beta placeholder", () => {
    const soakedPlug = (items as Array<Record<string, any>>).find(
      (item) => item.name === "soaked hydroponic starter plug"
    );

    expect(soakedPlug).toBeDefined();
    expect(soakedPlug?.price).toBeDefined();
    expect(soakedPlug?.price).toMatch(/[0-9]/);
    expect(soakedPlug?.priceExemptionReason ?? null).not.toBe(
      PriceExemptionReason.BETA_PLACEHOLDER
    );
  });

  it("prices the ISS spotting station instead of using a beta placeholder", () => {
    const spottingStation = (items as Array<Record<string, any>>).find(
      (item) => item.name === "ISS spotting station"
    );

    expect(spottingStation).toBeDefined();
    expect(spottingStation?.price).toBeDefined();
    expect(spottingStation?.price).toMatch(/[0-9]/);
    expect(spottingStation?.priceExemptionReason ?? null).not.toBe(
      PriceExemptionReason.BETA_PLACEHOLDER
    );
  });

  it("prices the photoresistor instead of using a beta placeholder", () => {
    const photoresistor = (items as Array<Record<string, any>>).find(
      (item) => item.name === "Photoresistor"
    );

    expect(photoresistor).toBeDefined();
    expect(photoresistor?.price).toBeDefined();
    expect(photoresistor?.price).toMatch(/[0-9]/);
    expect(photoresistor?.priceExemptionReason ?? null).not.toBe(
      PriceExemptionReason.BETA_PLACEHOLDER
    );
  });
});
