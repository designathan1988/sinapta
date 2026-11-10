import "./breadcrumbs.css";
import { html, nothing, type TemplateResult } from "lit-html";
import {
  selectBreadcrumbs,
  selectPageTitle,
  type PageBlock,
} from "../../blocks/page/index.ts";
import {
  setActivePage,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";

function label(page: PageBlock): string {
  const title = selectPageTitle(page);
  return `${page.props.icon ?? ""} ${title === "" ? COPY.sidebar.untitled : title}`.trim();
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
  return html`<nav class="breadcrumbs" aria-label=${COPY.breadcrumbs.label}>
    <ol class="breadcrumbs__list">
      ${items}
    </ol>
  </nav>`;
}
