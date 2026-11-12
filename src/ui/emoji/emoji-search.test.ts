import { beforeAll, describe, expect, it } from "vitest";
import { emojiGroups, searchEmoji } from "./emoji-search.ts";
import { loadEmoji as loadEmojiList } from "./emoji-search.ts";

beforeAll(async () => {
  await loadEmojiList();
});

describe("searchEmoji", () => {
  it("finds an emoji by the start of a word of its name", () => {
    const found = searchEmoji("smi", 50).map((emoji) => emoji.char);

    expect(found).toContain("😄");
  });

  it("needs every word of the query to match", () => {
    const found = searchEmoji("black heart", 10).map((emoji) => emoji.name);

    expect(found).toContain("heavy black heart");
    expect(found.every((name) => name.includes("black"))).toBe(true);
  });

  it("lists names that start with the query first", () => {
    expect(searchEmoji("rocket", 5)[0]?.char).toBe("🚀");
  });

  it("finds nothing for an empty query", () => {
    expect(searchEmoji("", 10)).toEqual([]);
  });
});

describe("emojiGroups", () => {
  it("reads every group with its emoji", () => {
    const groups = emojiGroups();

    expect(groups.map((group) => group.name)).toContain("Faces");
    expect(groups.flatMap((group) => group.emoji).length).toBeGreaterThan(1000);
  });
});
