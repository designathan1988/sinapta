// How many words and characters, as the page menu's foot says it:
// "4 words · 18 characters".
import { PAGE_TEXT } from "./page-text.ts";
import { pluralize } from "./pluralize.ts";

export function countLabel(count: {
  readonly words: number;
  readonly characters: number;
}): string {
  const { words, characters } = PAGE_TEXT.pageInfo;
  return `${String(count.words)} ${pluralize(count.words, words)} · ${String(count.characters)} ${pluralize(count.characters, characters)}`;
}
