import "./breadcrumbs.css";
import { html, nothing, type TemplateResult } from "lit-html";
import {
  selectBreadcrumbs,
  selectPageTitle,
  type PageBlock,
} from "../../blocks/page/index.ts";
import {
  openOverlay,
  setActivePage,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { MOVE_TO_OVERLAY_KIND } from "../page-menu/index.ts";
import { selectPagePlace, type PagePlace } from "./page-place.selectors.ts";

function label(page: PageBlock): string {
  const title = selectPageTitle(page);
  return `${page.props.icon ?? ""} ${title === "" ? COPY.sidebar.untitled : title}`.trim();
}

// Notion's place beside the title: Private or Shared after it, a teamspace
// before the path; it opens Move to for the open page.
function renderPlace(
  state: AppState,
  dispatch: Dispatch,
  place: PagePlace,
): TemplateResult {
  const pageId = state.ui.activePageId ?? "";
  const open = () =>
    dispatch(
      openOverlay.create({
        overlay: { kind: MOVE_TO_OVERLAY_KIND, anchorId: pageId },
      }),
    );
  if (place.kind === "teamspace") {
    const { name } = place.teamspace.props;
    return html`<li class="breadcrumbs__item">
      <button type="button" class="breadcrumbs__link" @click=${open}>
        ${name}
      </button>
    </li>`;
  }
  const words =
    place.kind === "shared" ? COPY.sidebar.shared : COPY.sidebar.private;
  return html`<button
    type="button"
    class="breadcrumbs__place"
    aria-haspopup="dialog"
    @click=${open}
  >
    ${place.kind === "private" ? renderIcon("lock") : nothing}
    <span>${words}</span>
    <span class="breadcrumbs__chevron">${renderIcon("chevron")}</span>
  </button>`;
}

// The path from the top level to the open page.
export function renderBreadcrumbs(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const trail = selectBreadcrumbs(state, state.ui.activePageId);
  if (trail.length === 0) return nothing;
  const items = trail.map((page, index) => {
    const isCurrent = index === trail.length - 1;
    return html`<li class="breadcrumbs__item">
      <button
        type="button"
        class="breadcrumbs__link"
        aria-current=${isCurrent ? "page" : nothing}
        @click=${() => dispatch(setActivePage.create({ pageId: page.id }))}
      >
        ${label(page)}
      </button>
    </li>`;
  });
  const place = selectPagePlace(state, state.ui.activePageId);
  const isInTeamspace = place?.kind === "teamspace";
  return html`<nav class="breadcrumbs" aria-label=${COPY.breadcrumbs.label}>
    <ol class="breadcrumbs__list">
      ${isInTeamspace ? renderPlace(state, dispatch, place) : nothing} ${items}
    </ol>
    ${
      isInTeamspace || place === undefined
        ? nothing
        : renderPlace(state, dispatch, place)
    }
  </nav>`;
}
