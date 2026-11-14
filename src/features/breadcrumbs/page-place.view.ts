// Notion's place beside the title (n92-private-label): Private or Shared
// after it, a teamspace before the path; each opens Move to under it.
import { html, nothing, type TemplateResult } from "lit-html";
import {
  closeOverlay,
  openOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { MOVE_TO_OVERLAY, MOVE_TO_PLACE_PANEL } from "../move-to/index.ts";
import type { PagePlace } from "./page-place.selectors.ts";

interface Toggle {
  readonly isOpen: boolean;
  readonly open: () => void;
}

function toggleOf(state: AppState, dispatch: Dispatch): Toggle {
  const pageId = state.ui.activePageId ?? "";
  const { overlay } = state.ui;
  const isOpen =
    overlay?.kind === MOVE_TO_OVERLAY && overlay.anchorId === pageId;
  const panel = MOVE_TO_PLACE_PANEL;
  const open = () =>
    dispatch(
      isOpen
        ? closeOverlay.create({})
        : openOverlay.create({
            overlay: { kind: MOVE_TO_OVERLAY, anchorId: pageId, panel },
          }),
    );
  return { isOpen, open };
}

function renderTeamspaceCrumb(name: string, toggle: Toggle): TemplateResult {
  return html`<li class="breadcrumbs__item">
    <button
      type="button"
      class="breadcrumbs__link"
      data-overlay-anchor
      aria-haspopup="dialog"
      aria-expanded=${String(toggle.isOpen)}
      @click=${toggle.open}
    >
      ${name}
    </button>
  </li>`;
}

export function renderPlace(
  state: AppState,
  dispatch: Dispatch,
  place: PagePlace,
): TemplateResult {
  const toggle = toggleOf(state, dispatch);
  if (place.kind === "teamspace") {
    return renderTeamspaceCrumb(place.teamspace.props.name, toggle);
  }
  const words =
    place.kind === "shared" ? COPY.sidebar.shared : COPY.sidebar.private;
  return html`<button
    type="button"
    class="breadcrumbs__place"
    data-overlay-anchor
    aria-haspopup="dialog"
    aria-expanded=${String(toggle.isOpen)}
    @click=${toggle.open}
  >
    ${place.kind === "private" ? renderIcon("lock") : nothing}
    <span>${words}</span>
    <span class="breadcrumbs__chevron">${renderIcon("chevron")}</span>
  </button>`;
}
