// Notion's "Show your view history" box under Viewers, on a workspace kept
// on the server: Allow names this person among a page's viewers; Don't
// allow still counts their views, without their name.
import { html, nothing, type TemplateResult } from "lit-html";
import {
  closeOverlay,
  openOverlay,
  setShowsHistory,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { renderMenu } from "../../ui/menu/index.ts";

export const VIEW_HISTORY_OVERLAY = "view-history";
const TEXT = COPY.pageUpdates;

export function renderHistoryBox(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const allowed = state.ui.pageUpdates?.showsHistory;
  if (allowed === undefined) return nothing;
  const isOpen = state.ui.overlay?.kind === VIEW_HISTORY_OVERLAY;
  const overlay = { kind: VIEW_HISTORY_OVERLAY, anchorId: "view-history" };
  return html`<div class="page-updates__history-box">
    <div>
      <p class="page-updates__history-title">${TEXT.showHistory}</p>
      <p class="page-updates__history-text">${TEXT.showHistoryText}</p>
    </div>
    <button
      type="button"
      class="page-updates__history-choice"
      aria-haspopup="menu"
      aria-expanded=${String(isOpen)}
      data-overlay-anchor
      @click=${() =>
        dispatch(
          isOpen ? closeOverlay.create({}) : openOverlay.create({ overlay }),
        )}
    >
      ${allowed ? TEXT.allow : TEXT.dontAllow} ${renderIcon("chevron")}
    </button>
  </div>`;
}

export function renderViewHistoryMenu(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  const allowed = state.ui.pageUpdates?.showsHistory !== false;
  const choose = (choice: boolean) => () =>
    dispatch(setShowsHistory.create({ allowed: choice }));
  return renderMenu({
    label: TEXT.showHistory,
    isNarrow: true,
    items: [
      { label: TEXT.allow, isChecked: allowed, onSelect: choose(true) },
      { label: TEXT.dontAllow, isChecked: !allowed, onSelect: choose(false) },
    ],
    onClose: () => dispatch(closeOverlay.create({})),
  });
}
