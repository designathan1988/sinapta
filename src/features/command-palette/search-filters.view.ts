// The search's filter chips, as Notion's: Title only, In page (the pages
// to look in, chosen from a list with a search) and, from Filter, a Date
// chip whose popover chooses the field and the days.
import "./search-filters.css";
import { html, nothing, type TemplateResult } from "lit-html";
import {
  closeChildOverlay,
  openChildOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon, type IconName } from "../../ui/icon/index.ts";
import { renderMenu } from "../../ui/menu/index.ts";
import { childIndexOf } from "../../ui/overlay/index.ts";
import { changeFilters, type FilterContext } from "./search-filter-context.ts";
import { onInPageKey, renderInPageList } from "./search-in-page.view.ts";
import { dateLabel, selectInPageLabel } from "./search-filters.selectors.ts";
import { DATE_ANCHOR, renderDateFilter } from "./search-date.view.ts";

const TEXT = COPY.palette;
const IN_PAGE_ANCHOR = "search-in-page";
const FILTER_ANCHOR = "search-filter";

function isOpen(state: AppState, anchorId: string): boolean {
  return childIndexOf(state.ui.overlay, anchorId) === 0;
}

function toggleChild(context: FilterContext, anchorId: string): void {
  context.dispatch(
    isOpen(context.state, anchorId)
      ? closeChildOverlay.create({ depth: 0 })
      : openChildOverlay.create({ anchorId, depth: 0 }),
  );
}

interface ChipLook {
  readonly anchorId: string;
  readonly label: string;
  readonly icon: IconName;
  readonly isActive: boolean;
  readonly kind?: "filter" | "in-page";
}

// A chip that opens its list, then the list while it is open.
function renderChip(
  context: FilterContext,
  look: ChipLook,
  list: () => TemplateResult,
): TemplateResult {
  const open = isOpen(context.state, look.anchorId);
  return html`<span class="command-palette__filter">
    <button
      type="button"
      class="command-palette__chip"
      data-overlay-child-anchor
      data-kind=${look.kind ?? nothing}
      aria-haspopup="dialog"
      aria-expanded=${String(open)}
      ?data-active=${look.isActive}
      @click=${() => {
        toggleChild(context, look.anchorId);
      }}
    >
      ${renderIcon(look.icon)}<span>${look.label}</span>${
        look.kind === "filter"
          ? nothing
          : html`<span class="command-palette__chevron" aria-hidden="true"
              >${renderIcon("chevron")}</span
            >`
      }
    </button>
    ${open ? list() : nothing}
  </span>`;
}

function renderFilterMenu(context: FilterContext): TemplateResult {
  return renderMenu({
    label: TEXT.filter,
    isChild: true,
    items: [
      {
        label: TEXT.date,
        icon: "calendar",
        keepsOpen: true,
        onSelect: () => {
          changeFilters(context, { date: { field: "edited", range: null } });
          context.dispatch(
            openChildOverlay.create({ anchorId: DATE_ANCHOR, depth: 0 }),
          );
        },
      },
    ],
    onClose: () => context.dispatch(closeChildOverlay.create({ depth: 0 })),
  });
}

function renderTitleOnly(context: FilterContext): TemplateResult {
  const { isTitleOnly } = context.filters;
  return html`<button
    type="button"
    class="command-palette__chip"
    aria-pressed=${String(isTitleOnly)}
    ?data-active=${isTitleOnly}
    @click=${() => {
      changeFilters(context, { isTitleOnly: !isTitleOnly });
    }}
  >
    ${renderIcon("title")}<span>${TEXT.titleOnly}</span>
  </button>`;
}

function renderInPage(context: FilterContext): TemplateResult {
  return renderChip(
    context,
    {
      anchorId: IN_PAGE_ANCHOR,
      label: selectInPageLabel(context.state, context.filters),
      icon: "page",
      isActive: context.filters.inPageIds.length > 0,
      kind: "in-page",
    },
    () => renderInPageList(context),
  );
}

// "Filter" until the date is added, then the Date chip in its place.
function renderDateOrFilter(context: FilterContext): TemplateResult {
  const { date } = context.filters;
  if (date === null)
    return renderChip(
      context,
      {
        anchorId: FILTER_ANCHOR,
        label: TEXT.filter,
        icon: "filter",
        isActive: false,
        kind: "filter",
      },
      () => renderFilterMenu(context),
    );
  return renderChip(
    context,
    {
      anchorId: DATE_ANCHOR,
      label: dateLabel(date),
      icon: "calendar",
      isActive: date.range !== null,
    },
    () => renderDateFilter(context, date),
  );
}

export function renderSearchFilters(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  const context = { state, dispatch, filters: state.ui.searchFilters };
  return html`<div
    class="command-palette__filters"
    role="group"
    aria-label=${TEXT.filters}
    @keydown=${(event: KeyboardEvent) => {
      if (isOpen(state, IN_PAGE_ANCHOR)) onInPageKey(event, context);
    }}
  >
    ${renderTitleOnly(context)} ${renderInPage(context)}
    ${renderDateOrFilter(context)}
  </div>`;
}
