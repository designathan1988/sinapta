import "./database.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { selectDatabase } from "../../blocks/database/index.ts";
import {
  closeOverlay,
  openOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { renderButton } from "../../ui/button/index.ts";
import { renderIcon, type IconName } from "../../ui/icon/index.ts";
import { TOOLTIP_TARGET, tooltipTitle } from "../../ui/tooltip/index.ts";
import { COPY, pluralize } from "../../ui/copy.ts";
import { addRow } from "./row.commands.ts";
import {
  FILTERS_OVERLAY,
  PROPERTIES_OVERLAY,
  renderTableOverlay,
} from "./database-menus.view.ts";
import type { TableContext } from "./table-cell.view.ts";
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
  const isMenuOpen = state.ui.overlay?.kind === NEW_VIEW_OVERLAY;
  const toggleMenu = (): void => {
    const overlay = { kind: NEW_VIEW_OVERLAY };
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
  const databaseId = model.database.id;
  const tabs = model.database.props.viewIds.flatMap((viewId) => {
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
  const isOpen = context.state.ui.overlay?.kind === button.kind;
  const toggle = (): void => {
    const next = isOpen
      ? closeOverlay.create({})
      : openOverlay.create({ overlay: { kind: button.kind } });
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
    count: model.view.filters.length,
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

function renderFooter(context: TableContext): TemplateResult {
  const { model, dispatch } = context;
  const shown = model.rows.length;
  const count =
    shown === model.totalRowCount
      ? String(shown)
      : `${String(shown)} / ${String(model.totalRowCount)}`;
  const message =
    model.totalRowCount === 0 ? COPY.database.empty : COPY.database.noRows;
  const noun = pluralize(model.totalRowCount, COPY.database.rowCount);
  const add = (): void => {
    dispatch(
      addRow.create({
        databaseId: model.database.id,
        opensPage: model.view.type !== "table",
      }),
    );
  };
  return html`<div class="database__footer">
    <button type="button" class="database__add-row" @click=${add}>
      ${renderIcon("plus")} <span>${COPY.database.newRow}</span>
    </button>
    <span class="database__count" role="status"
      >${shown === 0 ? message : `${count} ${noun}`}</span
    >
  </div>`;
}

// Layouts that list rows one under another end with "New page" and a
// count; boards, galleries and calendars add rows where they sit.
const LISTED_LAYOUTS: ReadonlySet<string> = new Set(["table", "list"]);

// A database page: its views as tabs, the view's tools and its table.
export function renderDatabase(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const database = selectDatabase(state, state.ui.activePageId);
  // Today in the reader's own time zone, for filters relative to it.
  const today = new Date().toLocaleDateString("en-CA");
  const viewModel =
    database === undefined
      ? undefined
      : selectTableModel(state, database.id, today);
  if (viewModel === undefined) return nothing;
  const model = selectSearchedModel(state, viewModel);
  const context = { state, dispatch, model };
  return html`<section class="database">
    ${renderToolbar(context)} ${renderLayout(context)}
    ${LISTED_LAYOUTS.has(model.view.type) ? renderFooter(context) : nothing}
    ${renderTableOverlay(context)}
  </section>`;
}
