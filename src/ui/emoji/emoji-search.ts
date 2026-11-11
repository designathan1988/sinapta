// Emoji by name, for the picker and for ":name" while typing. Names are
// the Unicode character names, so "heavy black heart" is ❤️.
import { EMOJI_GROUPS } from "./emoji-data.ts";

export interface Emoji {
  readonly char: string;
  readonly name: string;
}

export interface EmojiGroup {
  readonly name: string;
  readonly emoji: readonly Emoji[];
}

function readEntries(entries: string): Emoji[] {
  return entries.split(";").flatMap((entry) => {
    const space = entry.indexOf(" ");
    if (space <= 0) return [];
    return [{ char: entry.slice(0, space), name: entry.slice(space + 1) }];
  });
}

let groups: readonly EmojiGroup[] | undefined;

// Read once, on first use.
export function emojiGroups(): readonly EmojiGroup[] {
  groups ??= EMOJI_GROUPS.map((group) => ({
    name: group.name,
    emoji: readEntries(group.entries),
  }));
  return groups;
}

// Every word of the query must start a word of the name. Names that start
// with the query come first.
export function searchEmoji(query: string, limit: number): Emoji[] {
  const words = query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word !== "");
  if (words.length === 0) return [];
  const matches = (emoji: Emoji): boolean => {
    const nameWords = emoji.name.split(" ");
    return words.every((word) =>
      nameWords.some((part) => part.startsWith(word)),
    );
  };
  const found = emojiGroups()
    .flatMap((group) => group.emoji)
    .filter(matches);
  const first = words[0] ?? "";
  const isLead = (emoji: Emoji): number =>
    emoji.name.startsWith(first) ? 0 : 1;
  return found.sort((a, b) => isLead(a) - isLead(b)).slice(0, limit);
}
