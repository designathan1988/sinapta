import { describe, expect, it } from "vitest";
import {
  parseBlockClipboard,
  serializeBlockClipboard,
  type ClipboardBlock,
} from "./block-clipboard.schema.ts";

const blocks: ClipboardBlock[] = [
  { kind: "heading", depth: 0, text: [{ text: "Plan" }], level: 2 },
  { kind: "to-do", depth: 1, text: [{ text: "Ship" }], isChecked: true },
];

describe("the block clipboard", () => {
  it("reads back the blocks it wrote", () => {
    expect(parseBlockClipboard(serializeBlockClipboard(blocks))).toEqual(
      blocks,
    );
  });

  it.each([
    ["text that is not JSON", "{ nope"],
    ["JSON of another shape", '{"blocks":"x"}'],
    [
      "a block with a bad level",
      '{"version":1,"blocks":[{"kind":"heading","depth":0,"text":[],"level":9}]}',
    ],
  ])("refuses %s", (_, text) => {
    expect(parseBlockClipboard(text)).toBeUndefined();
  });
});
