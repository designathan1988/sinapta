// Notion's "Move page to…" (n92-private-label): a popover under the
// page's place in the top bar, its search field first, then the places
// the page may go, those matching what was typed.
import { html, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import {
  closeOverlay,
  setOverlayQuery,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { focusOnce } from "../../ui/focus/index.ts";
import { showPopoverWhenConnected } from "../../ui/overlay/index.ts";
import { renderOption, type MoveEntry } from "./move-to.view.ts";

// The overlay's panel when the top bar's place opened it.
export const MOVE_TO_PLACE_PANEL = "place";

function renderSearch(query: string, dispatch: Dispatch): TemplateResult {
  return html`<input
    class="move-to__search"
    type="search"
    aria-label=${COPY.moveTo.search}
    placeholder=${COPY.moveTo.search}
    .value=${query}
    @input=${(event: Event) => {
      if (!(event.currentTarget instanceof HTMLInputElement)) return;
      dispatch(setOverlayQuery.create({ query: event.currentTarget.value }));
    }}
    ${ref(focusOnce)}
  />`;
}

export function renderMovePopover(
  state: AppState,
  dispatch: Dispatch,
  entries: readonly MoveEntry[],
): TemplateResult {
  const query = state.ui.overlay?.query ?? "";
  const words = query.trim().toLowerCase();
  const shown = entries.filter((entry) =>
    entry.label.toLowerCase().includes(words),
  );
  return html`<div
    class="move-to__popover"
    data-overlay
    popover="manual"
    role="dialog"
    aria-label=${COPY.moveTo.title}
    ${ref(showPopoverWhenConnected)}
    @keydown=${(event: KeyboardEvent) => {
      if (event.key === "Escape") dispatch(closeOverlay.create({}));
    }}
  >
    ${renderSearch(query, dispatch)}
    <p class="move-to__heading">${COPY.moveTo.suggested}</p>
    <ul class="move-to__list">
      ${
        shown.length === 0
          ? html`<li class="move-to__none">${COPY.menu.noMatches}</li>`
          : shown.map(renderOption)
      }
    </ul>
  </div>`;
}
