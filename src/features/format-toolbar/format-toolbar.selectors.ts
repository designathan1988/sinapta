// What the formatting toolbar works on: the selected text of one block and
// the style that text already has. Both are derived from the store.
import { CODE_TYPE } from "../../blocks/code/index.ts";
import { isTextBlock } from "../../blocks/index.ts";
import {
  splitRichText,
  type BlockId,
  type Mark,
  type TextSpan,
  type Tone,
} from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";

export const TONE_OVERLAY = "text-tone";

// The marks the toolbar offers, in the order its buttons show them.
export const TOOLBAR_MARKS: readonly Mark[] = [
  "bold",
  "italic",
  "underline",
  "strikethrough",
  "code",
];

export interface FormatRange {
  readonly blockId: BlockId;
  readonly start: number;
  readonly end: number;
}

export interface RangeStyle {
  // Marks every character of the range has.
  readonly marks: readonly Mark[];
  // A color or highlight shared by the whole range, if any.
  readonly color: Tone | undefined;
  readonly highlight: Tone | undefined;
  readonly hasLink: boolean;
}

// The selected range the toolbar formats, or undefined when there is none:
// a caret, a block selection, code, or another overlay in front.
export function selectFormatRange(state: AppState): FormatRange | undefined {
  const { selection, blockSelection, overlay } = state.ui;
  if (selection === null || blockSelection !== null) return undefined;
  if (overlay !== null && overlay.kind !== TONE_OVERLAY) return undefined;
  const start = Math.min(selection.anchorOffset, selection.focusOffset);
  const end = Math.max(selection.anchorOffset, selection.focusOffset);
  if (start === end) return undefined;
  const block = state.workspace.blocks[selection.blockId];
  if (!isTextBlock(block) || block.type === CODE_TYPE) return undefined;
  return { blockId: block.id, start, end };
}

function shared<T>(spans: readonly TextSpan[], read: (span: TextSpan) => T) {
  const first = spans[0];
  if (first === undefined) return undefined;
  const value = read(first);
  return spans.every((span) => read(span) === value) ? value : undefined;
}

export function selectRangeStyle(
  state: AppState,
  range: FormatRange,
): RangeStyle {
  const block = state.workspace.blocks[range.blockId];
  const text = isTextBlock(block) ? block.props.text : [];
  const [, rest] = splitRichText(text, range.start);
  const [spans] = splitRichText(rest, range.end - range.start);
  const hasMark = (mark: Mark): boolean =>
    spans.length > 0 &&
    spans.every((span) => span.marks?.includes(mark) === true);
  return {
    marks: TOOLBAR_MARKS.filter(hasMark),
    color: shared(spans, (span) => span.color),
    highlight: shared(spans, (span) => span.highlight),
    hasLink: spans.some((span) => span.href !== undefined),
  };
}
