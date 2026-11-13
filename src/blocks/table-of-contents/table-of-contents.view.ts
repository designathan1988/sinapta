import "./table-of-contents.css";
import { html, type TemplateResult } from "lit-html";
import type { BlockId } from "../../model/index.ts";
import {
  setSelection,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { revealBlock } from "../../ui/focus/index.ts";
import {
  selectTableOfContents,
  type TocEntry,
} from "./table-of-contents.selectors.ts";

// Moves to a heading: the page scrolls to it, flashes it, and the caret
// goes into it.
function goTo(blockId: BlockId, dispatch: Dispatch): void {
  revealBlock(blockId, "start");
  const selection = { blockId, anchorOffset: 0, focusOffset: 0 };
  dispatch(setSelection.create({ selection }));
}

function renderEntry(entry: TocEntry, dispatch: Dispatch): TemplateResult {
  const title = entry.text === "" ? COPY.blocks.heading : entry.text;
  return html`<li class="table-of-contents__entry" data-level=${entry.level}>
    <button
      type="button"
      class="table-of-contents__link"
      @click=${() => {
        goTo(entry.blockId, dispatch);
      }}
    >
      ${title}
    </button>
  </li>`;
}

export function renderTableOfContents(
  blockId: BlockId,
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  const entries = selectTableOfContents(state, blockId);
  const label = COPY.blocks.tableOfContents;
  if (entries.length === 0) {
    return html`<p class="table-of-contents__empty">
      ${COPY.blocks.tableOfContentsEmpty}
    </p>`;
  }
  return html`<nav class="table-of-contents" aria-label=${label}>
    <ol class="table-of-contents__list">
      ${entries.map((entry) => renderEntry(entry, dispatch))}
    </ol>
  </nav>`;
}
