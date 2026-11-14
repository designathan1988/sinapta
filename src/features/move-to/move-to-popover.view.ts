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
import { selectWorkspaceName } from "../sidebar/index.ts";
import { renderOption, type MoveEntry } from "./move-to.view.ts";

export { MOVE_TO_PLACE_PANEL } from "../page-menu/index.ts";

function renderSearch(
  query: string,
  dispatch: Dispatch,
  words: string,
): TemplateResult {
  return html`<input
    class="move-to__search"
    type="search"
    aria-label=${words}
    placeholder=${words}
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
  moving: { readonly entries: readonly MoveEntry[]; readonly search: string },
): TemplateResult {
  const { entries, search } = moving;
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
    ${renderSearch(query, dispatch, search)}
    <p class="move-to__heading">${COPY.moveTo.suggested}</p>
    <ul class="move-to__list">
      ${
        shown.length === 0
          ? html`<li class="move-to__none">${COPY.menu.noMatches}</li>`
          : shown.map(renderOption)
      }
    </ul>
    <p class="move-to__foot">${selectWorkspaceName(state)}</p>
  </div>`;
}
