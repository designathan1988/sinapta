// A CSV file read as a new database, as Notion imports one: the first row
// names the columns, the first column holds each row's title, and every
// other column takes the type all its values read as: number, date,
// checkbox, a select of under 20 repeated values, or else text.
import { COPY } from "../../ui/copy.ts";

export interface CsvColumn {
  readonly name: string;
  readonly type: string;
  // A select's options, in the order rows first use them.
  readonly optionNames: readonly string[];
}

export interface CsvImportPlan {
  readonly columns: readonly CsvColumn[];
  // Each row's title, then its values as text the column's type reads.
  readonly rows: readonly (readonly string[])[];
}

interface Guess {
  readonly type: string;
  readonly optionNames: readonly string[];
  readonly normal: (text: string) => string;
}

const MAX_OPTIONS = 20;
const YES = new Set(["true", "yes", "y", "checked", "x"]);
const NO = new Set(["false", "no", "n", "unchecked"]);
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

const pad = (value: number): string => String(value).padStart(2, "0");

// A day as the app keeps it, from its own form or as Notion writes it
// ("November 12, 2026").
export function isoDay(text: string): string | undefined {
  const trimmed = text.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const written = /^([A-Za-z]+) (\d{1,2}), (\d{4})$/.exec(trimmed);
  if (written === null) return undefined;
  const [, monthName = "", day = "", year = ""] = written;
  const month = MONTHS.indexOf(monthName.toLowerCase()) + 1;
  return month === 0 ? undefined : `${year}-${pad(month)}-${pad(Number(day))}`;
}

const isNumber = (text: string): boolean => Number.isFinite(Number(text));
const isYesOrNo = (text: string): boolean =>
  YES.has(text.toLowerCase()) || NO.has(text.toLowerCase());

const TEXT: Guess = { type: "text", optionNames: [], normal: (t) => t };
const trim = (text: string): string => text.trim();

function guessColumn(values: readonly string[]): Guess {
  const filled = values.map(trim).filter((value) => value !== "");
  if (filled.length === 0) return TEXT;
  if (filled.every(isNumber)) return { ...TEXT, type: "number", normal: trim };
  if (filled.every((value) => isoDay(value) !== undefined)) {
    return { ...TEXT, type: "date", normal: (t) => isoDay(t) ?? "" };
  }
  if (filled.every(isYesOrNo)) {
    const normal = (t: string): string =>
      YES.has(t.trim().toLowerCase()) ? "true" : "";
    return { ...TEXT, type: "checkbox", normal };
  }
  const names = [...new Set(filled)];
  if (names.length <= MAX_OPTIONS && names.length < filled.length) {
    return { type: "select", optionNames: names, normal: trim };
  }
  return TEXT;
}

const cellOf = (row: readonly string[], index: number): string =>
  row[index] ?? "";

export function planCsvImport(
  table: readonly (readonly string[])[],
): CsvImportPlan {
  const [header = [], ...body] = table;
  const width = Math.max(header.length, ...body.map((row) => row.length));
  const indexes = Array.from(
    { length: Math.max(0, width - 1) },
    (_, index) => index + 1,
  );
  const guesses = indexes.map((index) =>
    guessColumn(body.map((row) => cellOf(row, index))),
  );
  const columns = guesses.map((guess, column) => {
    const name = cellOf(header, column + 1).trim();
    return {
      name: name === "" ? COPY.database.csvColumn(column + 2) : name,
      type: guess.type,
      optionNames: guess.optionNames,
    };
  });
  const rows = body
    .filter((row) => row.some((text) => text.trim() !== ""))
    .map((row) => [
      cellOf(row, 0).trim(),
      ...guesses.map((guess, column) => guess.normal(cellOf(row, column + 1))),
    ]);
  return { columns, rows };
}
