// Groups of text, as Notion's "Text by": by the whole value (Exact), or
// by its first character (Alphabetical), as Notion forms them: a letter
// A to Z in its upper case, a digit in its own group, and anything else
// (an accented letter, an emoji, a sign) under "Other", after the
// letters; digits come first.
import { COPY } from "../../../../ui/copy.ts";
import type { GroupKey, Grouping } from "../../grouping-definition.ts";

const LETTER = /^[A-Za-z]$/;
const DIGIT = /^[0-9]$/;
const OTHER_KEY = "other";

function firstGroup(text: string): GroupKey {
  const first = text.trim().charAt(0);
  if (DIGIT.test(first))
    return { key: first, label: first, sortValue: `a${first}` };
  if (LETTER.test(first)) {
    const letter = first.toUpperCase();
    return { key: letter, label: letter, sortValue: `b${letter}` };
  }
  const label = COPY.database.otherLetters;
  return { key: OTHER_KEY, label, sortValue: "c" };
}

export const TEXT_GROUPING: Grouping = {
  keysOf(value, _property, groupBy) {
    if (typeof value !== "string" || value.trim() === "") return [];
    if (groupBy?.textBy === "alphabetical") return [firstGroup(value)];
    return [{ key: value, label: value }];
  },
};
