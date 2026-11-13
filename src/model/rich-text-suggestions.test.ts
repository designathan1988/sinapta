import { describe, expect, it } from "vitest";
import { toBlockId } from "./workspace-builder.ts";
import {
  acceptSuggestion,
  rejectSuggestion,
  suggestDelete,
  suggestedText,
  suggestInsert,
} from "./rich-text-suggestions.ts";

const D = toBlockId("d1");
const E = toBlockId("e1");

describe("suggested edits", () => {
  it("keeps typed text as a suggestion until accepted or rejected", () => {
    const typed = suggestInsert([{ text: "Hello" }], 5, {
      text: " zz",
      discussionId: D,
    });

    expect(typed).toEqual([
      { text: "Hello" },
      { text: " zz", suggestion: "insert", comments: [D] },
    ]);
    expect(suggestedText(typed, D)).toBe(" zz");
    expect(acceptSuggestion(typed, D)).toEqual([{ text: "Hello zz" }]);
    expect(rejectSuggestion(typed, D)).toEqual([{ text: "Hello" }]);
  });

  it("strikes deleted text, and deleting a suggested insertion removes it", () => {
    const typed = suggestInsert([{ text: "Hello" }], 5, {
      text: "!",
      discussionId: D,
    });

    const deleted = suggestDelete(typed, { start: 1, end: 6 }, E);

    expect(deleted).toEqual([
      { text: "H" },
      { text: "ello", suggestion: "delete", comments: [E] },
    ]);
    expect(acceptSuggestion(deleted, E)).toEqual([{ text: "H" }]);
    expect(rejectSuggestion(deleted, E)).toEqual([{ text: "Hello" }]);
  });
});
