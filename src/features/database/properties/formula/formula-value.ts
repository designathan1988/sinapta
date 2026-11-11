// The values a formula works with: numbers, text, true and false, dates,
// lists of values, and nothing.
export interface FormulaDate {
  readonly kind: "date";
  // "YYYY-MM-DD", or "YYYY-MM-DDTHH:MM" when it has a time.
  readonly start: string;
  readonly end?: string;
}

export type FormulaValue =
  number | string | boolean | FormulaDate | readonly FormulaValue[] | null;

// A mistake found while working a formula out, such as a division by
// zero; the cell shows its message.
export class FormulaError extends Error {}

export function isDate(value: FormulaValue): value is FormulaDate {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isList(value: FormulaValue): value is readonly FormulaValue[] {
  return Array.isArray(value);
}

// Empty as Notion counts it: nothing, empty text, an empty list, zero
// and false.
export function isEmptyValue(value: FormulaValue): boolean {
  if (value === null || value === "" || value === 0 || value === false) {
    return true;
  }
  return isList(value) && value.length === 0;
}

// The value as text, as the cell and text joins write it.
export function valueText(value: FormulaValue): string {
  if (value === null) return "";
  if (isList(value)) return value.map(valueText).join(", ");
  if (isDate(value)) {
    return value.end === undefined
      ? value.start
      : `${value.start} → ${value.end}`;
  }
  return String(value);
}

export function asNumber(value: FormulaValue, name: string): number {
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  throw new FormulaError(`${name} needs a number.`);
}

export function asText(value: FormulaValue): string {
  return valueText(value);
}

export function asList(
  value: FormulaValue,
  name: string,
): readonly FormulaValue[] {
  if (isList(value)) return value;
  throw new FormulaError(`${name} needs a list.`);
}

export function asDate(value: FormulaValue, name: string): FormulaDate {
  if (isDate(value)) return value;
  throw new FormulaError(`${name} needs a date.`);
}

export function sameValue(a: FormulaValue, b: FormulaValue): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
