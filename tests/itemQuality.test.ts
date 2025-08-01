import { describe, it, expect } from "vitest";
import items from "../frontend/src/pages/inventory/json/items.json";
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
});
