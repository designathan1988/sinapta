// How many words and characters some blocks' text has, as Notion counts
// them: words by the browser's word segmenter, characters as graphemes.
// The page menu counts a page; the block menu counts the blocks selected.
import type { Block } from "../model/index.ts";
import { isTextBlock, textOf } from "./text-block.ts";

export interface WordCount {
  readonly words: number;
  readonly characters: number;
}

const WORDS = new Intl.Segmenter(undefined, { granularity: "word" });
const GRAPHEMES = new Intl.Segmenter(undefined, { granularity: "grapheme" });

export function countText(blocks: readonly Block[]): WordCount {
  let words = 0;
  let characters = 0;
  for (const block of blocks) {
    if (!isTextBlock(block)) continue;
    const text = textOf(block);
    for (const part of WORDS.segment(text)) if (part.isWordLike) words += 1;
    characters += [...GRAPHEMES.segment(text)].length;
  }
  return { words, characters };
}
