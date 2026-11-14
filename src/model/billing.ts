// Paying for a plan, as Notion's Billing: each plan's price for a member
// each month, and the checks a card passes before it is kept. Only its
// brand, last four digits and expiry are ever kept, never its number.
import type { PlanId } from "./plan.ts";

// Notion's monthly prices, in cents for a member; Enterprise has no
// public price ("Contact sales").
export const PLAN_PRICE_CENTS: Readonly<Record<PlanId, number | null>> = {
  free: 0,
  plus: 1200,
  business: 2400,
  enterprise: null,
};

export const CARD_BRANDS = [
  "visa",
  "mastercard",
  "amex",
  "discover",
  "card",
] as const;
export type CardBrand = (typeof CARD_BRANDS)[number];

// The digits of a card number as typed, spaces and dashes left out.
export function cardDigits(text: string): string {
  return text.replace(/[\s-]/g, "");
}

export function cardBrand(digits: string): CardBrand {
  if (digits.startsWith("4")) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "mastercard";
  if (/^3[47]/.test(digits)) return "amex";
  if (/^6(011|5)/.test(digits)) return "discover";
  return "card";
}

// The Luhn checksum every card number carries in its last digit.
export function isLuhnValid(digits: string): boolean {
  if (!/^\d{12,19}$/.test(digits)) return false;
  let sum = 0;
  for (let index = 0; index < digits.length; index += 1) {
    const char = digits.charAt(digits.length - 1 - index);
    const digit = Number(char) * (index % 2 === 1 ? 2 : 1);
    sum += digit > 9 ? digit - 9 : digit;
  }
  return sum % 10 === 0;
}

export interface MonthOfYear {
  readonly month: number;
  readonly year: number;
}

// A card is good through the last day of its expiry month.
export function isUnexpired(expiry: MonthOfYear, today: MonthOfYear): boolean {
  if (expiry.month < 1 || expiry.month > 12) return false;
  return (
    expiry.year > today.year ||
    (expiry.year === today.year && expiry.month >= today.month)
  );
}

// What a month of the plan costs for so many members; null when the plan
// has no public price.
export function planCharge(plan: PlanId, seats: number): number | null {
  const price = PLAN_PRICE_CENTS[plan];
  return price === null ? null : price * Math.max(1, seats);
}
