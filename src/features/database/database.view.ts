import "./database.css";
import { html, nothing, type TemplateResult } from "lit-html";
import type { BlockId } from "../../model/index.ts";
import {
  closeOverlay,
  openOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { renderButton } from "../../ui/button/index.ts";
import { renderIcon, type IconName } from "../../ui/icon/index.ts";
import { TOOLTIP_TARGET, tooltipTitle } from "../../ui/tooltip/index.ts";
import { COPY } from "../../ui/copy.ts";
import { addRow } from "./row.commands.ts";
import {
  FILTERS_OVERLAY,
  PROPERTIES_OVERLAY,
  renderTableOverlay,
} from "./database-menus.view.ts";
import { LISTED_LAYOUTS, renderFooter } from "./database-footer.view.ts";
import type { TableContext } from "./table-cell.view.ts";
import { isOpenFor } from "./database-overlay.ts";
import { filterCount } from "./filter-match.ts";
import { selectTableModel } from "./table-model.selectors.ts";
import { NEW_VIEW_OVERLAY, renderLayout } from "./view-layout.view.ts";
import { setViewSearch } from "./view-search.commands.ts";
import {
  selectSearchedModel,
  selectViewSearch,
} from "./view-search.selectors.ts";
import { setActiveView } from "./view.commands.ts";

function renderNewViewButton(context: TableContext): TemplateResult {
  const { state, dispatch } = context;
  const overlay = {
    kind: NEW_VIEW_OVERLAY,
    anchorId: context.model.holderId,
  };
  const isMenuOpen = isOpenFor(state, overlay);
  const toggleMenu = (): void => {
    dispatch(
      isMenuOpen ? closeOverlay.create({}) : openOverlay.create({ overlay }),
    );
  };
  return html`<button
    type="button"
    class="button"
    data-variant="quiet"
    data-overlay-anchor
    aria-haspopup="menu"
    aria-expanded=${String(isMenuOpen)}
    aria-label=${COPY.database.newView}
    title=${tooltipTitle(COPY.database.newView)}
    interestfor=${TOOLTIP_TARGET}
    @click=${toggleMenu}
  >
    ${renderIcon("plus")}
  </button>`;
}

const VIEW_ICONS: Readonly<Record<string, IconName>> = {
  table: "table",
  board: "board",
  gallery: "gallery",
  list: "list",
  calendar: "calendar",
};

function renderTabs(context: TableContext): TemplateResult {
  const { model, state, dispatch } = context;
  const databaseId = model.holderId;
  const tabs = model.viewIds.flatMap((viewId) => {
    const view = state.workspace.views[viewId];
    if (view === undefined) return [];
    return html`<button
      type="button"
      class="database__tab"
      aria-pressed=${String(view.id === model.view.id)}
      @click=${() => dispatch(setActiveView.create({ databaseId, viewId }))}
    >
      ${renderIcon(VIEW_ICONS[view.type] ?? "table")}
      <span>${view.name}</span>
    </button>`;
  });
  return html`<div
    class="database__tabs"
    role="group"
    aria-label=${COPY.database.views}
  >
    ${tabs} ${renderNewViewButton(context)}
  </div>`;
}

interface PopoverButton {
  readonly kind: string;
  readonly label: string;
  readonly icon: IconName;
  readonly count?: number;
}

// A quiet icon button that opens one of the view's popovers; a count, such
// as how many filters apply, shows beside the icon.
function renderPopoverButton(
  button: PopoverButton,
  context: TableContext,
): TemplateResult {
  const overlay = { kind: button.kind, anchorId: context.model.holderId };
  const isOpen = isOpenFor(context.state, overlay);
  const toggle = (): void => {
    const next = isOpen
      ? closeOverlay.create({})
      : openOverlay.create({ overlay });
    context.dispatch(next);
  };
  const count = button.count ?? 0;
  return html`<button
    type="button"
    class="button database__tool"
    data-variant="quiet"
    data-overlay-anchor
    aria-label=${button.label}
    aria-expanded=${String(isOpen)}
    ?data-active=${count > 0}
    title=${tooltipTitle(button.label)}
    interestfor=${TOOLTIP_TARGET}
    @click=${toggle}
  >
    ${renderIcon(button.icon)}
    ${count > 0 ? html`<span>${String(count)}</span>` : nothing}
  </button>`;
}

function renderSearch(context: TableContext): TemplateResult {
  const { state, model, dispatch } = context;
  const viewId = model.view.id;
  const onInput = (event: Event): void => {
    if (event.target instanceof HTMLInputElement)
      dispatch(setViewSearch.create({ viewId, query: event.target.value }));
  };
  return html`<label class="database__search">
    ${renderIcon("search")}
    <input
      type="search"
      aria-label=${COPY.database.search}
      placeholder=${COPY.database.searchPlaceholder}
      .value=${selectViewSearch(state, model)}
      @input=${onInput}
    />
  </label>`;
}

function renderToolbar(context: TableContext): TemplateResult {
  const { model, dispatch } = context;
  const filters = {
    kind: FILTERS_OVERLAY,
    label: COPY.database.filter,
    icon: "filter",
    count: filterCount(model.view.filter),
  } as const;
  const settings = {
    kind: PROPERTIES_OVERLAY,
    label: COPY.database.viewSettings,
    icon: "more",
  } as const;
  const addAndOpen = (): void => {
    dispatch(addRow.create({ databaseId: model.database.id, opensPage: true }));
  };
  return html`<div class="database__toolbar">
    ${renderTabs(context)}
    <span class="database__spacer"></span>
    ${renderPopoverButton(filters, context)} ${renderSearch(context)}
    ${renderPopoverButton(settings, context)}
    ${renderButton({
      label: COPY.database.newItem,
      variant: "primary",
      onClick: addAndOpen,
    })}
  </div>`;
}

// A database page: its views as tabs, the view's tools and its table.
// A database's views as tabs, the view's tools and its rows; a header
// such as an inline database's title goes above them.
export function renderDatabaseSection(
  state: AppState,
  dispatch: Dispatch,
  // The database, or the linked view, whose views are shown; a page's
  // body holds the inline ones.
  options: {
    holderId: BlockId | null;
    header?: TemplateResult;
    isInline?: boolean;
  },
): TemplateResult | typeof nothing {
  // Today in the reader's own time zone, for filters relative to it.
  const today = new Date().toLocaleDateString("en-CA");
  const { holderId } = options;
  const viewModel =
    holderId === null ? undefined : selectTableModel(state, holderId, today);
  if (viewModel === undefined) return nothing;
  const model = selectSearchedModel(state, viewModel);
  const context = { state, dispatch, model };
  return html`<section
    class="database"
    ?data-inline=${options.isInline === true}
  >
    ${options.header ?? nothing} ${renderToolbar(context)}
    ${renderLayout(context)}
    ${LISTED_LAYOUTS.has(model.view.type) ? renderFooter(context) : nothing}
    ${renderTableOverlay(context)}
  </section>`;
}

// The database that is open as a page.
export function renderDatabase(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  return renderDatabaseSection(state, dispatch, {
    holderId: state.ui.activePageId,
  });
}
