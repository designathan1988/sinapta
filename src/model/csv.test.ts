import { describe, expect, it } from "vitest";
import { parseCsv, writeCsv } from "./csv.ts";

describe("CSV", () => {
  it("reads quoted commas, doubled quotes and line breaks", () => {
    const text = 'Name,Note\r\n"Smith, J","He said ""hi""\nthen left"\r\n';

    expect(parseCsv(text)).toEqual([
      ["Name", "Note"],
      ["Smith, J", 'He said "hi"\nthen left'],
    ]);
  });

  it("drops a byte order mark and the last empty line", () => {
    expect(parseCsv("﻿a,b\nc,\n")).toEqual([
      ["a", "b"],
      ["c", ""],
    ]);
  });

  it("quotes only the fields that need it", () => {
    expect(writeCsv([["plain", "a,b", 'say "x"', "two\nlines"]])).toBe(
      'plain,"a,b","say ""x""","two\nlines"\r\n',
    );
  });

  it("reads back what it writes", () => {
    const rows = [
      ["Name", "Tags"],
      ["Résumé, final", 'quote " inside'],
      ["", "line\r\nbreak"],
    ];

    expect(parseCsv(writeCsv(rows))).toEqual(rows);
  });
});
