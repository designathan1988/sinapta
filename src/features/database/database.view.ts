import { renderViewTabs } from "./view-tabs.view.ts";
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
import { withDefaultTemplate } from "./template-default.commands.ts";
import { TEMPLATES_OVERLAY } from "./templates-menu.view.ts";
import {
  FILTERS_OVERLAY,
  VIEW_SETTINGS_OVERLAY,
  renderTableOverlay,
} from "./database-menus.view.ts";
import { LISTED_LAYOUTS, renderFooter } from "./database-footer.view.ts";
import type { TableContext } from "./table-cell.view.ts";
import { isOpenFor } from "./database-overlay.ts";
import { filterCount } from "./filter-match.ts";
import { selectTableModel } from "./table-model.selectors.ts";
import { renderLayout } from "./view-layout.view.ts";
import { setViewSearch } from "./view-search.commands.ts";
import {
  selectSearchedModel,
  selectViewSearch,
} from "./view-search.selectors.ts";

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
  const { model } = context;
  const filters = {
    kind: FILTERS_OVERLAY,
    label: COPY.database.filter,
    icon: "filter",
    count: filterCount(model.view.filter),
  } as const;
  const settings = {
    kind: VIEW_SETTINGS_OVERLAY,
    label: COPY.database.viewSettings,
    icon: "more",
  } as const;
  return html`<div class="database__toolbar">
    ${renderViewTabs(context)}
    <span class="database__spacer"></span>
    ${renderPopoverButton(filters, context)} ${renderSearch(context)}
    ${renderPopoverButton(settings, context)} ${renderNewButton(context)}
  </div>`;
}

// Notion's New: a new row from the default template, opened as the view
// opens rows; the arrow beside it lists the templates.
function renderNewButton(context: TableContext): TemplateResult {
  const { model, state, dispatch } = context;
  const overlay = { kind: TEMPLATES_OVERLAY, anchorId: model.holderId };
  const isOpen = isOpenFor(state, overlay);
  const addAndOpen = (): void => {
    const payload = {
      databaseId: model.database.id,
      opensPage: true,
      viewId: model.view.id,
    };
    dispatch(addRow.create(withDefaultTemplate(state, payload)));
  };
  return html`<span class="database__new">
    ${renderButton({
      label: COPY.database.newItem,
      variant: "primary",
      onClick: addAndOpen,
    })}
    <button
      type="button"
      class="button database__new-templates"
      data-variant="primary"
      data-overlay-anchor
      aria-haspopup="menu"
      aria-expanded=${String(isOpen)}
      aria-label=${COPY.database.templates}
      title=${tooltipTitle(COPY.database.templates)}
      interestfor=${TOOLTIP_TARGET}
      @click=${() =>
        dispatch(
          isOpen ? closeOverlay.create({}) : openOverlay.create({ overlay }),
        )}
    >
      ${renderIcon("chevron")}
    </button>
  </span>`;
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
