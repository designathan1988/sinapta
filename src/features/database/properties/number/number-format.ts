// How a number is written in a cell: plain, with commas, as a percent or
// as a currency, and what share of a bar or ring it fills.
import type { NumberConfig } from "./number.schema.ts";

const DEFAULT_LOCALE = "en-US";
const DEFAULT_CURRENCY = "USD";
const DEFAULT_DIVISOR = 100;
const MAX_FRACTION_DIGITS = 6;

// Fixed digits after the point when the property sets them.
function decimalOptions(config: NumberConfig): Intl.NumberFormatOptions {
  if (config.decimals === undefined) return {};
  return {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  };
}

function formatOptions(config: NumberConfig): Intl.NumberFormatOptions {
  return { ...baseOptions(config), ...decimalOptions(config) };
}

function baseOptions(config: NumberConfig): Intl.NumberFormatOptions {
  switch (config.format) {
    case "number":
      return { useGrouping: false, maximumFractionDigits: MAX_FRACTION_DIGITS };
    case "comma":
      return { maximumFractionDigits: MAX_FRACTION_DIGITS };
    case "percent":
      return { style: "percent", maximumFractionDigits: MAX_FRACTION_DIGITS };
    case "currency":
      return {
        style: "currency",
        currency: config.currency ?? DEFAULT_CURRENCY,
      };
    default: {
      const unknown: never = config.format;
      return unknown;
    }
  }
}

export function formatNumber(
  value: number,
  config: NumberConfig,
  locale = DEFAULT_LOCALE,
): string {
  return new Intl.NumberFormat(locale, formatOptions(config)).format(value);
}

// The value's share of the divisor, from 0 to 1, for a bar or a ring.
export function numberShare(value: number, config: NumberConfig): number {
  const share = value / (config.divideBy ?? DEFAULT_DIVISOR);
  return Math.min(1, Math.max(0, share));
}

// The currencies offered in the settings: common ones the browser knows.
const COMMON_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CNY",
  "BRL",
  "CAD",
  "AUD",
  "INR",
  "MXN",
  "CHF",
  "KRW",
  "SEK",
  "NOK",
  "DKK",
  "PLN",
  "RUB",
  "TRY",
  "ZAR",
  "ARS",
  "CLP",
  "COP",
  "PEN",
  "HKD",
  "SGD",
  "NZD",
  "ILS",
  "AED",
  "SAR",
  "IDR",
];

export function currencyChoices(): readonly string[] {
  const known = new Set(Intl.supportedValuesOf("currency"));
  return COMMON_CURRENCIES.filter((code) => known.has(code));
}
