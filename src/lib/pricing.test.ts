import { describe, expect, it } from "vitest";
import {
  defaultPricingCatalog,
  getEffectiveTierAmountCents,
  normalizePricingCatalog,
  validatePricingCatalog,
} from "./pricing";

describe("pricing catalog helpers", () => {
  it("calculates monthly and annual amounts with annual fallback", () => {
    const tier = defaultPricingCatalog.audiences[0].tiers[1];
    expect(getEffectiveTierAmountCents(tier, "monthly")).toMatchObject({
      baseAmountCents: 1400,
      effectiveAmountCents: 1400,
      salePercentOff: 0,
    });
    expect(getEffectiveTierAmountCents({ ...tier, annualPrice: undefined }, "annual").baseAmountCents).toBe(14000);
  });

  it("applies enabled percentage sales to the selected billing cycle", () => {
    const tier = {
      ...defaultPricingCatalog.audiences[0].tiers[2],
      sale: { enabled: true, percentOff: 25, label: "Launch" },
    };

    expect(getEffectiveTierAmountCents(tier, "monthly")).toMatchObject({
      baseAmountCents: 4900,
      effectiveAmountCents: 3675,
      salePercentOff: 25,
    });
  });

  it("rejects negative prices and invalid sale percentages", () => {
    const catalog = normalizePricingCatalog({
      audiences: [{
        key: "talent",
        tiers: [{
          id: "talent-plus",
          monthlyPrice: -10,
          monthlyAllowance: 200,
          sale: { enabled: true, percentOff: 125 },
        }],
      }],
    });

    const tier = catalog.audiences[0].tiers.find((item) => item.id === "talent-plus");
    expect(tier?.monthlyPrice).toBe(-10);
    expect(validatePricingCatalog(catalog)).toContain("talent-plus monthly price must be 0 or greater.");
    expect(validatePricingCatalog(catalog)).toContain("talent-plus sale percent must be between 1 and 100.");
  });
});
