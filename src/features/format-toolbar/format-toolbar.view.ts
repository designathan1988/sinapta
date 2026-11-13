// The panel over selected text, in Notion's new form: the block's type
// to turn it into another, two rows of formatting buttons, and Comment.
// It is shown while a range of one text block is selected, so it holds
// no state of its own.
import "./format-toolbar.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import type { AppState, Dispatch } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { afterRender } from "../../ui/focus/index.ts";
import { onToolbarKey } from "./format-toolbar-keys.view.ts";
import {
  renderCommentRow,
  renderFirstRow,
  renderSecondRow,
  renderTurnIntoRow,
  type PanelContext,
} from "./format-toolbar-rows.view.ts";
import { panelPlace } from "./format-toolbar-place.ts";
import {
  selectFormatRange,
  selectRangeStyle,
} from "./format-toolbar.selectors.ts";

// Pressing a button must not move the caret out of the text, or the
// selection it formats would be lost.
function keepSelection(event: Event): void {
  event.preventDefault();
}

// Places the panel under the selected text, or over it when the window
// has no room below, always inside the window. It runs after the render
// has finished and the caret is restored, so measuring reads no layout
// during the render.
function placePanel(element: Element | undefined): void {
  if (!(element instanceof HTMLElement)) return;
  afterRender(() => {
    if (!element.isConnected) return;
    if (!element.matches(":popover-open")) element.showPopover();
    const selection = document.getSelection();
    const anchor = selection?.anchorNode?.parentElement;
    if (selection === null || selection.rangeCount === 0) return;
    if (anchor?.closest("[data-text]") == null) return;
    const place = panelPlace(
      selection.getRangeAt(0).getBoundingClientRect(),
      element.getBoundingClientRect(),
      { width: window.innerWidth, height: window.innerHeight },
    );
    element.style.setProperty("--format-toolbar-x", `${String(place.x)}px`);
    element.style.setProperty("--format-toolbar-y", `${String(place.y)}px`);
  });
}

export function renderFormatToolbar(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const range = selectFormatRange(state);
  if (range === undefined) return nothing;
  const style = selectRangeStyle(state, range);
  const context: PanelContext = { state, dispatch, range, style };
  return html`<div
    class="format-toolbar"
    role="toolbar"
    aria-label=${COPY.formatToolbar.label}
    aria-orientation="vertical"
    popover="manual"
    data-format-toolbar
    ${ref((element) => {
      placePanel(element);
    })}
    @pointerdown=${keepSelection}
    @keydown=${onToolbarKey}
  >
    ${renderTurnIntoRow(context)}
    <hr class="format-toolbar__rule" />
    ${renderFirstRow(context)} ${renderSecondRow(context)}
    <hr class="format-toolbar__rule" />
    ${renderCommentRow(context)}
  </div>`;
}
