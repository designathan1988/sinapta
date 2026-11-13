// The floating outline at the page's right edge, as Notion's: a dash per
// heading; pointing at the dashes, or pressing Enter on them, opens the
// list of headings, indented by level; choosing one opens the toggles
// that hide it, scrolls to it, flashes it and puts the caret in it.
import "./page-outline.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { setHeadingOpen } from "../../blocks/heading/index.ts";
import { setToggleOpen } from "../../blocks/toggle/index.ts";
import type { BlockId } from "../../model/index.ts";
import {
  closeOverlay,
  openOverlay,
  setSelection,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { revealBlock } from "../../ui/focus/index.ts";
import { showPopoverWhenConnected } from "../../ui/overlay/index.ts";
import {
  selectClosedHolders,
  selectPageOutline,
  type OutlineEntry,
} from "./page-outline.selectors.ts";

export const PAGE_OUTLINE_OVERLAY = "page-outline";

const TEXT = COPY.pageOutline;

function goTo(state: AppState, dispatch: Dispatch, blockId: BlockId): void {
  dispatch(closeOverlay.create({}));
  for (const holder of selectClosedHolders(state, blockId)) {
    const open = { blockId: holder.blockId, isOpen: true };
    dispatch(
      holder.isHeading
        ? setHeadingOpen.create(open)
        : setToggleOpen.create(open),
    );
  }
  revealBlock(blockId, "start");
  const selection = { blockId, anchorOffset: 0, focusOffset: 0 };
  dispatch(setSelection.create({ selection }));
}

function renderList(
  entries: readonly OutlineEntry[],
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  return html`<div
    class="page-outline__list"
    popover="manual"
    data-overlay
    data-placement="before"
    ${ref(showPopoverWhenConnected)}
  >
    ${entries.map((entry) => {
      const name = entry.text === "" ? COPY.blocks.heading : entry.text;
      return html`<button
        type="button"
        class="page-outline__entry"
        data-level=${entry.dash}
        data-block=${entry.blockId}
        aria-label=${TEXT.jumpTo(name)}
        @click=${() => {
          goTo(state, dispatch, entry.blockId);
        }}
      >
        ${name}
      </button>`;
    })}
  </div>`;
}

function renderDashes(
  entries: readonly OutlineEntry[],
  isOpen: boolean,
  open: () => void,
): TemplateResult {
  return html`<button
    type="button"
    class="page-outline__dashes"
    aria-label=${TEXT.label}
    aria-expanded=${String(isOpen)}
    data-overlay-anchor
    @pointerenter=${open}
    @click=${open}
  >
    ${entries.map(
      (entry) =>
        html`<span class="page-outline__dash" data-size=${entry.dash}></span>`,
    )}
  </button>`;
}

export function renderPageOutline(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const pageId = state.ui.activePageId;
  if (pageId === null) return nothing;
  const entries = selectPageOutline(state, pageId);
  if (entries.length === 0) return nothing;
  const { overlay } = state.ui;
  const isOpen = overlay?.kind === PAGE_OUTLINE_OVERLAY;
  // Pointing opens the list only while no other menu is open.
  const open = (): void => {
    if (overlay !== null) return;
    const next = { kind: PAGE_OUTLINE_OVERLAY, anchorId: pageId };
    dispatch(openOverlay.create({ overlay: next }));
  };
  return html`<nav
    class="page-outline"
    aria-label=${TEXT.label}
    @pointerleave=${() => {
      if (isOpen) dispatch(closeOverlay.create({}));
    }}
  >
    ${renderDashes(entries, isOpen, open)}
    ${isOpen ? renderList(entries, state, dispatch) : nothing}
  </nav>`;
}
