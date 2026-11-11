import { describe, expect, it } from "vitest";
import { parseJsonText } from "./json-text.schema.ts";

describe("parseJsonText", () => {
  it("reads JSON text into a value", () => {
    expect(parseJsonText('{"schemaVersion":1}')).toEqual({
      ok: true,
      json: { schemaVersion: 1 },
    });
  });

  it("reports text that is not JSON without throwing", () => {
    expect(parseJsonText("{ not json")).toEqual({ ok: false });
  });
});
