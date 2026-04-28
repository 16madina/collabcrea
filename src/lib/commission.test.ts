import { describe, it, expect } from "vitest";
import {
  computeCommission,
  BRAND_FEE_PERCENTAGE,
  CREATOR_FEE_PERCENTAGE,
  PLATFORM_FEE_PERCENTAGE,
  MIN_AGREED_AMOUNT_FCFA,
} from "./commission";

describe("commission policy constants", () => {
  it("brand fee is 10%", () => {
    expect(BRAND_FEE_PERCENTAGE).toBe(0.10);
  });
  it("creator fee is 5%", () => {
    expect(CREATOR_FEE_PERCENTAGE).toBe(0.05);
  });
  it("platform fee total is 15%", () => {
    expect(PLATFORM_FEE_PERCENTAGE).toBeCloseTo(0.15, 10);
  });
});

describe("computeCommission – exact reference example", () => {
  it("10 000 FCFA → marque 11 000, créateur 9 500, platform 1 500", () => {
    const r = computeCommission(10_000);
    expect(r.agreedAmount).toBe(10_000);
    expect(r.brandFee).toBe(1_000);
    expect(r.creatorFee).toBe(500);
    expect(r.platformFee).toBe(1_500);
    expect(r.creatorAmount).toBe(9_500);
    expect(r.brandSubtotalFCFA).toBe(11_000);
    // Stripe markup 5% sur 11 000 = 11 550
    expect(r.brandTotalFCFA).toBe(11_550);
  });
});

describe("computeCommission – plusieurs montants", () => {
  const cases: Array<{
    agreed: number;
    brandFee: number;
    creatorFee: number;
    creatorAmount: number;
    brandSubtotal: number;
  }> = [
    { agreed: 1_000, brandFee: 100, creatorFee: 50, creatorAmount: 950, brandSubtotal: 1_100 },
    { agreed: 5_000, brandFee: 500, creatorFee: 250, creatorAmount: 4_750, brandSubtotal: 5_500 },
    { agreed: 25_000, brandFee: 2_500, creatorFee: 1_250, creatorAmount: 23_750, brandSubtotal: 27_500 },
    { agreed: 50_000, brandFee: 5_000, creatorFee: 2_500, creatorAmount: 47_500, brandSubtotal: 55_000 },
    { agreed: 100_000, brandFee: 10_000, creatorFee: 5_000, creatorAmount: 95_000, brandSubtotal: 110_000 },
    { agreed: 250_000, brandFee: 25_000, creatorFee: 12_500, creatorAmount: 237_500, brandSubtotal: 275_000 },
    { agreed: 1_000_000, brandFee: 100_000, creatorFee: 50_000, creatorAmount: 950_000, brandSubtotal: 1_100_000 },
  ];

  cases.forEach(({ agreed, brandFee, creatorFee, creatorAmount, brandSubtotal }) => {
    it(`${agreed} FCFA → brand=${brandFee} creator=${creatorFee} wallet=${creatorAmount}`, () => {
      const r = computeCommission(agreed);
      expect(r.brandFee).toBe(brandFee);
      expect(r.creatorFee).toBe(creatorFee);
      expect(r.creatorAmount).toBe(creatorAmount);
      expect(r.brandSubtotalFCFA).toBe(brandSubtotal);
      expect(r.platformFee).toBe(brandFee + creatorFee);
    });
  });
});

describe("computeCommission – arrondis FCFA", () => {
  it("montant impair 1 234 → arrondit chaque commission à l'entier", () => {
    const r = computeCommission(1_234);
    // 10% de 1234 = 123.4 → 123
    expect(r.brandFee).toBe(123);
    // 5% de 1234 = 61.7 → 62
    expect(r.creatorFee).toBe(62);
    // 15% de 1234 = 185.1 → 185
    expect(r.platformFee).toBe(185);
    expect(r.creatorAmount).toBe(1_234 - 62);
    expect(r.brandSubtotalFCFA).toBe(1_234 + 123);
  });

  it("montant 333 → 5% = 16.65 → 17", () => {
    const r = computeCommission(333);
    expect(r.brandFee).toBe(33); // 33.3 → 33
    expect(r.creatorFee).toBe(17); // 16.65 → 17
    expect(r.creatorAmount).toBe(316);
  });

  it("montant 555 → 10% = 55.5 → 56, 5% = 27.75 → 28", () => {
    const r = computeCommission(555);
    expect(r.brandFee).toBe(56);
    expect(r.creatorFee).toBe(28);
    expect(r.creatorAmount).toBe(527);
  });

  it("agreedAmount décimal est arrondi en entier avant calcul", () => {
    const r = computeCommission(9_999.7);
    expect(r.agreedAmount).toBe(10_000);
    expect(r.creatorAmount).toBe(9_500);
  });

  it("le créateur reçoit toujours un entier FCFA", () => {
    for (const amount of [777, 1_111, 3_333, 7_777, 12_345, 98_765]) {
      const r = computeCommission(amount);
      expect(Number.isInteger(r.creatorAmount)).toBe(true);
      expect(Number.isInteger(r.brandFee)).toBe(true);
      expect(Number.isInteger(r.creatorFee)).toBe(true);
    }
  });
});

describe("computeCommission – bornes et invariants", () => {
  it("montant en dessous du minimum est bridé à 200 FCFA", () => {
    const r = computeCommission(50);
    expect(r.agreedAmount).toBe(MIN_AGREED_AMOUNT_FCFA);
    expect(r.brandFee).toBe(20);
    expect(r.creatorFee).toBe(10);
    expect(r.creatorAmount).toBe(190);
  });

  it("montant zéro est bridé au minimum", () => {
    const r = computeCommission(0);
    expect(r.agreedAmount).toBe(MIN_AGREED_AMOUNT_FCFA);
  });

  it("creatorAmount + creatorFee = agreedAmount", () => {
    for (const amount of [200, 1_000, 1_234, 9_999, 50_000, 1_000_000]) {
      const r = computeCommission(amount);
      expect(r.creatorAmount + r.creatorFee).toBe(r.agreedAmount);
    }
  });

  it("brandSubtotalFCFA = agreedAmount + brandFee", () => {
    for (const amount of [500, 1_500, 7_777, 100_000]) {
      const r = computeCommission(amount);
      expect(r.brandSubtotalFCFA).toBe(r.agreedAmount + r.brandFee);
    }
  });

  it("brandTotalFCFA inclut le markup Stripe 5%", () => {
    const r = computeCommission(20_000);
    // (20 000 + 2 000) × 1.05 = 23 100
    expect(r.brandTotalFCFA).toBe(23_100);
  });
});
