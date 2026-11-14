import { describe, expect, it } from "vitest";
import {
  cardBrand,
  cardDigits,
  isLuhnValid,
  isUnexpired,
  planCharge,
} from "./billing.ts";

describe("a card", () => {
  it("reads its brand from its first digits", () => {
    expect(cardBrand("4242424242424242")).toBe("visa");
    expect(cardBrand("5555555555554444")).toBe("mastercard");
    expect(cardBrand("378282246310005")).toBe("amex");
    expect(cardBrand("6011111111111117")).toBe("discover");
  });

  it("passes the Luhn checksum only with the right last digit", () => {
    expect(isLuhnValid(cardDigits("4242 4242 4242 4242"))).toBe(true);
    expect(isLuhnValid("4242424242424241")).toBe(false);
    expect(isLuhnValid("42")).toBe(false);
  });

  it("is good through its expiry month", () => {
    const today = { month: 11, year: 2026 };

    expect(isUnexpired({ month: 11, year: 2026 }, today)).toBe(true);
    expect(isUnexpired({ month: 10, year: 2026 }, today)).toBe(false);
    expect(isUnexpired({ month: 13, year: 2030 }, today)).toBe(false);
  });
});

describe("a plan's charge", () => {
  it("is its price for each member, Enterprise's unpriced", () => {
    expect(planCharge("plus", 3)).toBe(3600);
    expect(planCharge("business", 0)).toBe(2400);
    expect(planCharge("free", 5)).toBe(0);
    expect(planCharge("enterprise", 5)).toBeNull();
  });
});
