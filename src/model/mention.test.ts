import { describe, expect, it } from "vitest";
import { toBlockId } from "./workspace-builder.ts";
import { insertMention, renameMentions } from "./mention.ts";
import { concatRichText, deleteRange, insertText } from "./rich-text.ts";
import type { RichText } from "./rich-text.schema.ts";

const PLAN = toBlockId("plan");
const mention = (text: string) => ({
  text,
  mention: { kind: "page" as const, pageId: PLAN },
});

describe("page mentions in rich text", () => {
  it("keeps a mention apart from the text around it", () => {
    const rich = concatRichText(
      [{ text: "a" }],
      [mention("Plan"), { text: "b" }],
    );

    expect(rich).toHaveLength(3);
  });

  it("types after a mention as plain text", () => {
    const rich: RichText = [{ text: "see " }, mention("Plan")];

    expect(insertText(rich, 8, "!")).toEqual([
      { text: "see " },
      mention("Plan"),
      { text: "!" },
    ]);
  });

  it("deletes the whole mention when a deletion reaches into it", () => {
    const rich: RichText = [{ text: "a" }, mention("Plan"), { text: "b" }];

    expect(deleteRange(rich, 4, 5)).toEqual([{ text: "ab" }]);
  });

  it("replaces what was typed to find the page with the mention", () => {
    const rich: RichText = [{ text: "say @pl" }];

    expect(
      insertMention(rich, { start: 4, end: 7, span: mention("Plan") }),
    ).toEqual([{ text: "say " }, mention("Plan")]);
  });

  it("follows a renamed page and keeps other text as it is", () => {
    const rich: RichText = [{ text: "a" }, mention("Old")];
    const other: RichText = [{ text: "nothing to rename" }];

    expect(renameMentions(rich, PLAN, "New")).toEqual([
      { text: "a" },
      mention("New"),
    ]);
    expect(renameMentions(other, PLAN, "New")).toBe(other);
  });
});
