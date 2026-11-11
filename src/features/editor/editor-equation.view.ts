// Inline equations in a block's text: Ctrl+Shift+E turns selected text
// into one, or opens the editor of the equation beside the caret; a click
// on one opens its editor too. The editor is a field for the TeX source
// that changes the equation as it is typed.
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { isTextBlock } from "../../blocks/index.ts";
import {
  parseBlockId,
  plainText,
  splitRichText,
  type BlockId,
} from "../../model/index.ts";
import {
  closeOverlay,
  openOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import {
  blockIdOf,
  offsetWithin,
  readSelection,
  textElementOf,
} from "../../ui/caret/index.ts";
import { COPY } from "../../ui/copy.ts";
import { showPopoverWhenConnected } from "../../ui/overlay/index.ts";
import {
  INLINE_EQUATION_OVERLAY,
  makeInlineEquation,
  setInlineEquation,
} from "./editor-equation.commands.ts";
import type { InputContext } from "./editor-input.view.ts";

interface Place {
  readonly blockId: BlockId;
  readonly start: number;
  readonly end: number;
}

function openEditor(place: Place, dispatch: Dispatch): void {
  const overlay = {
    kind: INLINE_EQUATION_OVERLAY,
    anchorId: place.blockId,
    start: place.start,
    end: place.end,
  };
  dispatch(openOverlay.create({ overlay }));
}

// The equation that ends or starts at the caret, if one does.
function equationAt(state: AppState, blockId: BlockId, caret: number) {
  const block = state.workspace.blocks[blockId];
  if (!isTextBlock(block)) return undefined;
  let start = 0;
  for (const span of block.props.text) {
    const end = start + span.text.length;
    const isNear = caret === start || caret === end;
    if (span.equation !== undefined && isNear) return { blockId, start, end };
    start = end;
  }
  return undefined;
}

function isEquationKey(event: KeyboardEvent): boolean {
  const hasMod = event.ctrlKey || event.metaKey;
  return (
    hasMod && event.shiftKey && !event.altKey && event.key.toLowerCase() === "e"
  );
}

export function equationKey(
  event: KeyboardEvent,
  context: InputContext,
): boolean {
  const selection = readSelection();
  if (!isEquationKey(event) || selection === null) return false;
  const { blockId, anchorOffset: start, focusOffset: end } = selection;
  if (start !== end) {
    context.dispatch(makeInlineEquation.create({ blockId, start, end }));
    return true;
  }
  const place = equationAt(context.state, blockId, end);
  if (place === undefined) return false;
  openEditor(place, context.dispatch);
  return true;
}

export function onEquationClick(event: Event, dispatch: Dispatch): void {
  if (!(event.target instanceof Element)) return;
  const piece = event.target.closest<HTMLElement>(".equation[data-equation]");
  const text = textElementOf(piece);
  const blockId = blockIdOf(piece);
  if (piece === null || text === null || blockId === undefined) return;
  event.preventDefault();
  const start = offsetWithin(text, piece, 0);
  const end = start + piece.textContent.length;
  openEditor({ blockId, start, end }, dispatch);
}

function placeOf(state: AppState): Place | undefined {
  const { overlay } = state.ui;
  const blockId = parseBlockId(overlay?.anchorId ?? "");
  const { start, end } = overlay ?? {};
  if (overlay?.kind !== INLINE_EQUATION_OVERLAY || blockId === undefined) {
    return undefined;
  }
  return start === undefined || end === undefined
    ? undefined
    : { blockId, start, end };
}

function sourceOf(state: AppState, place: Place): string {
  const block = state.workspace.blocks[place.blockId];
  if (!isTextBlock(block)) return "";
  const [, rest] = splitRichText(block.props.text, place.start);
  return plainText(splitRichText(rest, place.end - place.start)[0]);
}

// Enter or Escape closes the editor; clearing the source removes the
// equation.
export function renderInlineEquationEditor(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const place = placeOf(state);
  if (place === undefined) return nothing;
  const onInput = (event: Event): void => {
    if (!(event.target instanceof HTMLInputElement)) return;
    const source = event.target.value;
    dispatch(setInlineEquation.create({ ...place, source }));
  };
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== "Escape" && event.key !== "Enter") return;
    event.preventDefault();
    dispatch(closeOverlay.create({}));
  };
  return html`<div
    class="editor__equation"
    popover="manual"
    data-overlay
    ${ref(showPopoverWhenConnected)}
    @keydown=${onKeyDown}
  >
    <input
      class="editor__equation-source"
      type="text"
      spellcheck="false"
      data-autofocus
      aria-label=${COPY.equation.inline}
      .value=${sourceOf(state, place)}
      @input=${onInput}
    />
  </div>`;
}
