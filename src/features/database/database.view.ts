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
import { renderIcon } from "../../ui/icon/index.ts";
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
import { deleteView, setActiveView } from "./view.commands.ts";

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
      ${view.name}
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

function renderPopoverButton(
  kind: string,
  label: string,
  context: TableContext,
): TemplateResult {
  const isOpen = context.state.ui.overlay?.kind === kind;
  const toggle = (): void => {
    const next = isOpen
      ? closeOverlay.create({})
      : openOverlay.create({ overlay: { kind } });
    context.dispatch(next);
  };
  return html`<button
    type="button"
    class="button"
    data-variant="quiet"
    data-overlay-anchor
    aria-expanded=${String(isOpen)}
    @click=${toggle}
  >
    ${label}
  </button>`;
}

function renderSearch(context: TableContext): TemplateResult {
  const { state, model, dispatch } = context;
  const viewId = model.view.id;
  const onInput = (event: Event): void => {
    if (event.target instanceof HTMLInputElement)
      dispatch(setViewSearch.create({ viewId, query: event.target.value }));
  };
  return html`<input
    class="database__search"
    type="search"
    aria-label=${COPY.database.search}
    placeholder=${COPY.database.searchPlaceholder}
    .value=${selectViewSearch(state, model)}
    @input=${onInput}
  />`;
}

function renderToolbar(context: TableContext): TemplateResult {
  const { model, dispatch } = context;
  const filterCount = model.view.filters.length;
  const filterLabel =
    filterCount === 0
      ? COPY.database.filter
      : `${COPY.database.filter} (${String(filterCount)})`;
  const canDelete = model.database.props.viewIds.length > 1;
  return html`<div class="database__toolbar">
    ${renderTabs(context)}
    <span class="database__spacer"></span>
    ${renderSearch(context)}
    ${renderPopoverButton(FILTERS_OVERLAY, filterLabel, context)}
    ${renderPopoverButton(PROPERTIES_OVERLAY, COPY.database.properties, context)}
    ${
      canDelete
        ? renderButton({
            label: COPY.database.deleteView,
            icon: "trash",
            isIconOnly: true,
            onClick: () =>
              dispatch(deleteView.create({ viewId: model.view.id })),
          })
        : nothing
    }
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
  return html`<div class="database__footer">
    ${renderButton({
      label: COPY.database.newRow,
      icon: "plus",
      onClick: () =>
        dispatch(
          addRow.create({
            databaseId: model.database.id,
            opensPage: model.view.type !== "table",
          }),
        ),
    })}
    <span class="database__count" role="status"
      >${shown === 0 ? message : `${count} ${noun}`}</span
    >
  </div>`;
}

// A database page: its views as tabs, the view's tools and its table.
export function renderDatabase(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const database = selectDatabase(state, state.ui.activePageId);
  const viewModel =
    database === undefined ? undefined : selectTableModel(state, database.id);
  if (viewModel === undefined) return nothing;
  const model = selectSearchedModel(state, viewModel);
  const context = { state, dispatch, model };
  return html`<section class="database">
    ${renderToolbar(context)} ${renderLayout(context)} ${renderFooter(context)}
    ${renderTableOverlay(context)}
  </section>`;
}
