import * as v from "valibot";
import { describe, expect, it } from "vitest";
import { blockColorSchema } from "./block-color.schema.ts";
import { TONES } from "./rich-text.schema.ts";

describe("the tones", () => {
  it("are Notion's nine, in Notion's order", () => {
    expect(TONES).toEqual([
      "gray",
      "brown",
      "orange",
      "yellow",
      "green",
      "blue",
      "purple",
      "pink",
      "red",
    ]);
  });

  it("give a block each tone as its text and as its background", () => {
    for (const tone of TONES) {
      expect(v.is(blockColorSchema, tone)).toBe(true);
      expect(v.is(blockColorSchema, `${tone}-background`)).toBe(true);
    }
  });
});
