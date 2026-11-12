// A day typed into the date picker's field, as Notion reads one: an ISO
// day, a US month/day/year, a month's name with its day (the year this
// year when left out), or today, tomorrow and yesterday.

const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

const RELATIVE: Readonly<Record<string, number>> = {
  today: 0,
  tomorrow: 1,
  yesterday: -1,
};

// "YYYY-MM-DD" for a day that exists, or undefined.
function dayOf(year: number, month: number, day: number): string | undefined {
  const date = new Date(Date.UTC(year, month - 1, day));
  const isReal =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
  return isReal ? date.toISOString().slice(0, 10) : undefined;
}

function shiftDay(today: string, by: number): string {
  const date = new Date(`${today}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + by);
  return date.toISOString().slice(0, 10);
}

// A month's number from its name or a start of it at least three long.
function monthNumber(name: string): number | undefined {
  const lower = name.toLowerCase();
  if (lower.length < 3) return undefined;
  const index = MONTHS.findIndex((month) => month.startsWith(lower));
  return index === -1 ? undefined : index + 1;
}

function yearOr(year: string | undefined, today: string): number {
  return Number(year ?? today.slice(0, 4));
}

type Rule = (text: string, today: string) => string | undefined;

// The numbers a pattern of digit groups finds, or none.
function numbersOf(pattern: RegExp, text: string): (number | undefined)[] {
  const found = pattern.exec(text);
  return found === null ? [] : found.slice(1).map(Number);
}

const RULES: readonly Rule[] = [
  (text, today) => {
    const by = RELATIVE[text.toLowerCase()];
    return by === undefined ? undefined : shiftDay(today, by);
  },
  (text) => {
    const [year, month, day] = numbersOf(/^(\d{4})-(\d{1,2})-(\d{1,2})$/, text);
    return year === undefined ? undefined : dayOf(year, month ?? 0, day ?? 0);
  },
  (text) => {
    const [month, day, year] = numbersOf(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
      text,
    );
    return year === undefined ? undefined : dayOf(year, month ?? 0, day ?? 0);
  },
  (text, today) => {
    const found = /^([a-z]+)\.?\s+(\d{1,2}),?(?:\s+(\d{4}))?$/i.exec(text);
    const month = monthNumber(found?.[1] ?? "");
    if (!found || month === undefined) return undefined;
    return dayOf(yearOr(found[3], today), month, +(found[2] ?? 0));
  },
  (text, today) => {
    const found = /^(\d{1,2})\s+([a-z]+)\.?,?(?:\s+(\d{4}))?$/i.exec(text);
    const month = monthNumber(found?.[2] ?? "");
    if (!found || month === undefined) return undefined;
    return dayOf(yearOr(found[3], today), month, +(found[1] ?? 0));
  },
];

export function parseTypedDate(
  text: string,
  today: string,
): string | undefined {
  const trimmed = text.trim();
  for (const rule of RULES) {
    const day = rule(trimmed, today);
    if (day !== undefined) return day;
  }
  return undefined;
}
