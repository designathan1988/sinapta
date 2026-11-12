import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import type { AppState, Dispatch } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { TOOLTIP_TARGET, tooltipTitle } from "../../ui/tooltip/index.ts";
import { renderPageMenuButton, TREE_PLACE } from "../page-menu/index.ts";
import type { TreeRow } from "./sidebar.selectors.ts";

const LEVEL_PROPERTY = "--sidebar-level";

function renderAddButton(): TemplateResult {
  return html`<button
    type="button"
    class="sidebar__add"
    tabindex="-1"
    data-action="add"
    aria-label=${COPY.sidebar.addSubpage}
    title=${tooltipTitle(COPY.sidebar.addSubpage)}
    interestfor=${TOOLTIP_TARGET}
  >
    ${renderIcon("plus")}
  </button>`;
}

// Indentation depends on the level, so it is set through the CSSOM.
function setLevel(row: Element | undefined, level: number): void {
  if (row instanceof HTMLElement) {
    row.style.setProperty(LEVEL_PROPERTY, String(level));
  }
}

// The page's emoji, or a page or table glyph when it has none.
function renderRowIcon(row: TreeRow): TemplateResult {
  const glyph = renderIcon(row.isDatabase ? "database" : "page");
  return html`<span class="sidebar__icon" aria-hidden="true"
    >${row.icon ?? glyph}</span
  >`;
}

// As Notion's, a page with pages inside shows its chevron where its icon
// is, while its row is pointed at or focused.
function renderLead(row: TreeRow): TemplateResult {
  if (!row.hasChildren) return renderRowIcon(row);
  return html`<button
    type="button"
    class="sidebar__toggle"
    tabindex="-1"
    data-action="toggle"
    aria-label=${
      row.isExpanded ? COPY.sidebar.collapsePage : COPY.sidebar.expandPage
    }
  >
    ${renderRowIcon(row)}
    <span class="sidebar__chevron" aria-hidden="true"
      >${renderIcon("chevron")}</span
    >
  </button>`;
}

export interface Context {
  readonly state: AppState;
  readonly dispatch: Dispatch;
}

// One row of the page tree.
export function renderRow(row: TreeRow, context: Context): TemplateResult {
  const title = row.title === "" ? COPY.sidebar.untitled : row.title;
  return html`<li
    class="sidebar__row"
    role="treeitem"
    tabindex=${row.isTabStop ? "0" : "-1"}
    data-page-id=${row.id}
    data-page-drop=${row.isDatabase ? nothing : row.id}
    aria-label=${title}
    aria-level=${row.level}
    aria-current=${row.isActive ? "page" : nothing}
    aria-expanded=${row.hasChildren ? String(row.isExpanded) : nothing}
    ?data-untitled=${row.title === ""}
    ${ref((element) => {
      setLevel(element, row.level);
    })}
  >
    ${renderLead(row)}
    <span class="sidebar__title">${title}</span>
    ${renderPageMenuButton({
      place: TREE_PLACE,
      pageId: row.id,
      isTabStop: false,
      ...context,
    })}
    ${renderAddButton()}
  </li>`;
}
