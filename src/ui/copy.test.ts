import { describe, expect, it } from "vitest";
import { COPY, pluralize } from "./copy.ts";

describe("pluralize", () => {
  it("uses the singular form for one", () => {
    expect(pluralize(1, COPY.database.rowCount)).toBe("row");
  });

  it("uses the plural form for zero and for more than one", () => {
    expect(pluralize(0, COPY.database.rowCount)).toBe("rows");
    expect(pluralize(5000, COPY.database.rowCount)).toBe("rows");
  });
});
