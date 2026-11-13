// Views kept in the sidebar, as Notion's "Add view to sidebar": a section
// per view under the database's name, which folds, with buttons to open
// the database, add a page and show the section's menu, then the view's
// first pages.
import "./sidebar-views.css";
import { html, nothing, type TemplateResult } from "lit-html";
import type { SidebarView } from "../../model/index.ts";
import {
  closeOverlay,
  openOverlay,
  setActivePage,
  setSidebarView,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon, type IconName } from "../../ui/icon/index.ts";
import { TOOLTIP_TARGET, tooltipTitle } from "../../ui/tooltip/index.ts";
import {
  addRow,
  openRow,
  selectRowTemplate,
  selectViewRows,
  setActiveView,
  withDefaultTemplate,
  type TableRow,
} from "../database/index.ts";
import { selectSection, type Section } from "./sidebar-views.selectors.ts";

export const SIDEBAR_VIEW_OVERLAY = "sidebar-view";
const TEXT = COPY.sidebarViews;
const DEFAULT_LIMIT = 5;

interface Context {
  readonly state: AppState;
  readonly dispatch: Dispatch;
}

// "Open": the database as a page, showing the section's view when the
// view is the database's own.
function openSectionDatabase(section: Section, dispatch: Dispatch): void {
  dispatch(setActivePage.create({ pageId: section.databaseId }));
  if (section.isOwnView) {
    dispatch(
      setActiveView.create({
        databaseId: section.databaseId,
        viewId: section.entry.viewId,
      }),
    );
  }
}

// "+": a page from the section's template, an empty one, or else the
// view's default template.
function addSectionPage(section: Section, context: Context): void {
  const { state, dispatch } = context;
  const { entry, databaseId } = section;
  const payload = { databaseId, opensPage: true, viewId: entry.viewId };
  if (entry.templateId === null) {
    dispatch(addRow.create(payload));
    return;
  }
  const template =
    entry.templateId === undefined
      ? undefined
      : selectRowTemplate(state, entry.templateId);
  dispatch(
    addRow.create(
      template === undefined
        ? withDefaultTemplate(state, payload)
        : { ...payload, template },
    ),
  );
}

function renderTool(
  label: string,
  icon: IconName,
  onClick: () => void,
): TemplateResult {
  return html`<button
    type="button"
    class="sidebar__add"
    aria-label=${label}
    title=${tooltipTitle(label)}
    interestfor=${TOOLTIP_TARGET}
    @click=${onClick}
  >
    ${renderIcon(icon)}
  </button>`;
}

function renderMenuButton(section: Section, context: Context): TemplateResult {
  const { state, dispatch } = context;
  const overlay = state.ui.overlay;
  const isOpen =
    overlay?.kind === SIDEBAR_VIEW_OVERLAY &&
    overlay.anchorId === section.entry.viewId;
  const toggle = (): void => {
    if (isOpen) dispatch(closeOverlay.create({}));
    else {
      const next = {
        kind: SIDEBAR_VIEW_OVERLAY,
        anchorId: section.entry.viewId,
      };
      dispatch(openOverlay.create({ overlay: next }));
    }
  };
  return html`<button
    type="button"
    class="sidebar__add"
    data-overlay-anchor
    aria-haspopup="menu"
    aria-expanded=${String(isOpen)}
    aria-label=${TEXT.menu}
    title=${tooltipTitle(TEXT.menu)}
    interestfor=${TOOLTIP_TARGET}
    @click=${toggle}
  >
    ${renderIcon("more")}
  </button>`;
}

function renderHead(section: Section, context: Context): TemplateResult {
  const { dispatch } = context;
  const { entry } = section;
  const isCollapsed = entry.isCollapsed === true;
  const fold = () =>
    dispatch(
      setSidebarView.create({
        viewId: entry.viewId,
        changes: { isCollapsed: !isCollapsed },
      }),
    );
  return html`<div class="sidebar__view-head">
    <button
      type="button"
      class="sidebar__heading sidebar__view-name"
      aria-expanded=${String(!isCollapsed)}
      @click=${fold}
    >
      <span class="sidebar__title">${section.name}</span>
      <span class="sidebar__view-chevron" aria-hidden="true"
        >${renderIcon("down")}</span
      >
    </button>
    <span class="sidebar__view-tools">
      ${renderTool(TEXT.open, "arrow-up-right", () => {
        openSectionDatabase(section, dispatch);
      })}
      ${renderTool(TEXT.addPage, "plus", () => {
        addSectionPage(section, context);
      })}
      ${renderMenuButton(section, context)}
    </span>
  </div>`;
}

// A page of the section: its icon, unless the section hides them, and
// its title; it opens where the section says.
function renderRow(row: TableRow, entry: SidebarView, context: Context) {
  const { state, dispatch } = context;
  const block = state.workspace.blocks[row.id];
  const emoji =
    block !== undefined && "icon" in block.props ? block.props.icon : null;
  const icon =
    entry.isIconHidden === true
      ? nothing
      : html`<span class="sidebar__icon" aria-hidden="true"
          >${typeof emoji === "string" ? emoji : renderIcon("page")}</span
        >`;
  const title = row.title === "" ? COPY.sidebar.untitled : row.title;
  const mode = entry.openMode ?? "side";
  const open = () =>
    dispatch(openRow.create({ rowId: row.id, viewId: entry.viewId, mode }));
  return html`<li>
    <button
      type="button"
      class="sidebar__item"
      aria-current=${state.ui.activePageId === row.id ? "page" : nothing}
      @click=${open}
    >
      ${icon}<span class="sidebar__title">${title}</span>
    </button>
  </li>`;
}

function renderRows(
  section: Section,
  entry: SidebarView,
  context: Context,
): TemplateResult {
  const today = new Date().toLocaleDateString("en-CA");
  const rows = selectViewRows(context.state, entry.viewId, today).slice(
    0,
    entry.limit ?? DEFAULT_LIMIT,
  );
  if (rows.length === 0) {
    return html`<p class="sidebar__empty">${TEXT.empty}</p>`;
  }
  return html`<ul aria-label=${section.name}>
    ${rows.map((row) => renderRow(row, entry, context))}
  </ul>`;
}

export function renderSidebarViews(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult[] {
  const context = { state, dispatch };
  return (state.workspace.settings.sidebarViews ?? []).flatMap((entry) => {
    const section = selectSection(state, entry);
    if (section === undefined) return [];
    return [
      html`<section class="sidebar__section sidebar__view">
        ${renderHead(section, context)}
        ${
          entry.isCollapsed === true
            ? nothing
            : renderRows(section, entry, context)
        }
      </section>`,
    ];
  });
}
