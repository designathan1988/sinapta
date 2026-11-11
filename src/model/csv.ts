// Comma-separated values as RFC 4180 writes them: fields split by commas,
// records by line breaks; a field holding a comma, a quote or a line break
// is quoted, and a quote inside it doubled.

// One field and what ends it: a comma, a line break or the end.
const FIELD = /(?:"((?:[^"]|"")*)"|([^",\r\n]*))(,|\r\n|\n|\r|$)/g;

export function parseCsv(text: string): string[][] {
  const source = text.startsWith("﻿") ? text.slice(1) : text;
  if (source === "") return [];
  const rows: string[][] = [];
  let row: string[] = [];
  for (const match of source.matchAll(FIELD)) {
    const [whole, quoted, plain = "", end = ""] = match;
    row.push(quoted === undefined ? plain : quoted.replaceAll('""', '"'));
    if (end === ",") continue;
    rows.push(row);
    row = [];
    // A last line break ends the file, not a row of its own.
    if (end === "" || match.index + whole.length >= source.length) break;
  }
  return rows;
}

function quoted(field: string): string {
  return /[",\r\n]/.test(field) ? `"${field.replaceAll('"', '""')}"` : field;
}

export function writeCsv(rows: readonly (readonly string[])[]): string {
  return rows.map((row) => `${row.map(quoted).join(",")}\r\n`).join("");
}
