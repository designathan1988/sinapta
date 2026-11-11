import "./breadcrumb.css";
import { html, nothing, type TemplateResult } from "lit-html";
import type { BlockId } from "../../model/index.ts";
import {
  setActivePage,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { selectBlockTrail, type TrailItem } from "./breadcrumb.selectors.ts";

function label(item: TrailItem): string {
  const title = item.title === "" ? COPY.sidebar.untitled : item.title;
  return `${item.icon ?? ""} ${title}`.trim();
}

// The path to the page the block sits in; each step opens its page.
export function renderBreadcrumb(
  blockId: BlockId,
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  const trail = selectBlockTrail(state, blockId);
  const items = trail.map((item, index) => {
    const isCurrent = index === trail.length - 1;
    return html`<li class="breadcrumb__item">
      <button
        type="button"
        class="breadcrumb__link"
        aria-current=${isCurrent ? "page" : nothing}
        @click=${() => dispatch(setActivePage.create({ pageId: item.pageId }))}
      >
        ${label(item)}
      </button>
    </li>`;
  });
  return html`<nav class="breadcrumb" aria-label=${COPY.breadcrumbBlock.label}>
    <ol class="breadcrumb__list">
      ${items}
    </ol>
  </nav>`;
}
