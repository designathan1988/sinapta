// "Customize sidebar", as Notion's: every shortcut, then every section, a
// row with a grip to drag it, its icon and name, and while pointed at its
// menu and "Remove from sidebar"; "Add shortcut" and "Add section" after
// each list, and a blue "Done" that ends the mode.
import "./sidebar-customize.css";
import { html, nothing, type TemplateResult } from "lit-html";
import {
  closeChildOverlay,
  closeOverlay,
  openChildOverlay,
  removeSidebarView,
  setSidebarSections,
  setSidebarShortcuts,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { TOOLTIP_TARGET, tooltipTitle } from "../../ui/tooltip/index.ts";
import {
  renderAddSectionMenu,
  renderAddShortcutMenu,
  renderSectionMenu,
  renderShortcutMenu,
} from "./sidebar-customize-menus.view.ts";
import {
  droppedKeys,
  sectionViewId,
  selectSections,
  selectShortcuts,
} from "./sidebar-layout.selectors.ts";
import { focusAfterRender } from "./sidebar-focus.ts";
import { sectionLook } from "./sidebar-section-look.ts";
import { renderShortcutIcon, shortcutLook } from "./sidebar-shortcuts.view.ts";

export const SIDEBAR_CUSTOMIZE_OVERLAY = "sidebar-customize";
const TEXT = COPY.sidebarCustomize;
const DRAG_TYPE = "text/plain";

interface Context {
  readonly state: AppState;
  readonly dispatch: Dispatch;
}

type ListName = "shortcuts" | "sections";

function isChildOpen(state: AppState, anchorId: string): boolean {
  return state.ui.overlay?.children?.[0]?.anchorId === anchorId;
}

// A control that opens one of the mode's menus right after itself.
function renderMenuControl(
  context: Context,
  look: { anchorId: string; label: string; body: TemplateResult },
  menu: () => TemplateResult,
): TemplateResult {
  const { state, dispatch } = context;
  const isOpen = isChildOpen(state, look.anchorId);
  const toggle = (): void => {
    if (isOpen) {
      dispatch(closeChildOverlay.create({ depth: 0 }));
      return;
    }
    dispatch(openChildOverlay.create({ anchorId: look.anchorId, depth: 0 }));
  };
  return html`<button
      type="button"
      class="sidebar__edit-control"
      data-overlay-child-anchor
      aria-haspopup="menu"
      aria-expanded=${String(isOpen)}
      aria-label=${look.label}
      @click=${toggle}
    >
      ${look.body}</button
    >${isOpen ? menu() : nothing}`;
}

function keysOf(state: AppState, list: ListName): readonly string[] {
  return list === "shortcuts" ? selectShortcuts(state) : selectSections(state);
}

function store(context: Context, list: ListName, keys: readonly string[]) {
  context.dispatch(
    list === "shortcuts"
      ? setSidebarShortcuts.create({ keys })
      : setSidebarSections.create({ keys }),
  );
}

function remove(context: Context, list: ListName, key: string): void {
  const viewId = sectionViewId(context.state, key);
  if (list === "sections" && viewId !== undefined) {
    context.dispatch(removeSidebarView.create({ viewId }));
  }
  const keys = keysOf(context.state, list).filter((other) => other !== key);
  store(context, list, keys);
}

// Dragging a row onto another puts it in that row's place.
function dragHandlers(context: Context, list: ListName, key: string) {
  return {
    start: (event: DragEvent) => {
      event.dataTransfer?.setData(DRAG_TYPE, `${list}:${key}`);
    },
    over: (event: DragEvent) => {
      event.preventDefault();
    },
    drop: (event: DragEvent) => {
      event.preventDefault();
      const data = event.dataTransfer?.getData(DRAG_TYPE) ?? "";
      if (!data.startsWith(`${list}:`)) return;
      const moved = data.slice(list.length + 1);
      store(
        context,
        list,
        droppedKeys(keysOf(context.state, list), moved, key),
      );
    },
  };
}

function renderRemove(
  context: Context,
  list: ListName,
  key: string,
): TemplateResult {
  return html`<button
    type="button"
    class="sidebar__edit-control"
    aria-label=${TEXT.remove}
    title=${tooltipTitle(TEXT.remove)}
    interestfor=${TOOLTIP_TARGET}
    @click=${() => {
      remove(context, list, key);
    }}
  >
    ${renderIcon("close")}
  </button>`;
}

function renderRow(
  context: Context,
  row: { list: ListName; key: string; icon: TemplateResult; label: string },
): TemplateResult {
  const { list, key } = row;
  const drag = dragHandlers(context, list, key);
  const menu = () =>
    list === "shortcuts"
      ? renderShortcutMenu(context, key)
      : renderSectionMenu(context, key);
  const menuLabel = list === "shortcuts" ? TEXT.shortcutMenu : TEXT.sectionMenu;
  return html`<li
    class="sidebar__edit-row"
    draggable="true"
    @dragstart=${drag.start}
    @dragover=${drag.over}
    @drop=${drag.drop}
  >
    <span class="sidebar__grip" aria-hidden="true">${renderIcon("grip")}</span>
    ${row.icon}<span class="sidebar__title">${row.label}</span>
    <span class="sidebar__edit-tools">
      ${renderMenuControl(
        context,
        {
          anchorId: `${list}-${key}`,
          label: menuLabel,
          body: renderIcon("sliders"),
        },
        menu,
      )}
      ${renderRemove(context, list, key)}
    </span>
  </li>`;
}

function shortcutRows(context: Context): TemplateResult[] {
  return selectShortcuts(context.state).flatMap((key) => {
    const look = shortcutLook(context.state, key);
    if (look === undefined) return [];
    const icon = renderShortcutIcon(look);
    return [
      renderRow(context, { list: "shortcuts", key, icon, label: look.label }),
    ];
  });
}

function sectionRows(context: Context): TemplateResult[] {
  return selectSections(context.state).flatMap((key) => {
    const look = sectionLook(context.state, key);
    if (look === undefined) return [];
    const icon = html`<span class="sidebar__icon" aria-hidden="true"
      >${renderIcon(look.icon)}</span
    >`;
    return [
      renderRow(context, { list: "sections", key, icon, label: look.label }),
    ];
  });
}

function renderAdd(
  context: Context,
  look: { anchorId: string; label: string },
  menu: () => TemplateResult,
): TemplateResult {
  const body = html`${renderIcon("plus")}<span>${look.label}</span>`;
  return html`<div class="sidebar__edit-add">
    ${renderMenuControl(context, { ...look, body }, menu)}
  </div>`;
}

export function renderSidebarCustomize(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  const context = { state, dispatch };
  const done = (): void => {
    dispatch(closeOverlay.create({}));
    focusAfterRender(".sidebar__customize-open");
  };
  return html`<div class="sidebar__edit">
    <ul class="sidebar__edit-list" aria-label=${TEXT.open}>
      ${shortcutRows(context)}
    </ul>
    ${renderAdd(
      context,
      { anchorId: "add-shortcut", label: TEXT.addShortcut },
      () => renderAddShortcutMenu(context),
    )}
    <hr class="sidebar__edit-rule" />
    <ul class="sidebar__edit-list" aria-label=${TEXT.sidebarSections}>
      ${sectionRows(context)}
    </ul>
    ${renderAdd(
      context,
      { anchorId: "add-section", label: TEXT.addSection },
      () => renderAddSectionMenu(context),
    )}
    <button
      type="button"
      class="button sidebar__edit-done"
      data-variant="primary"
      @click=${done}
    >
      ${TEXT.done}
    </button>
  </div>`;
}
