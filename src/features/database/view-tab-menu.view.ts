// The open view's menu, opened from its tab as Notion's: Rename; Show as
// (Text and icon, Text only, Icon only, for the owner alone); Edit view;
// Source; Copy link to view; Add view to sidebar; Open as full page; Hide
// data source titles; Duplicate view; Delete view.
import { calendarItems } from "./view-calendar-item.ts";
import { html, type TemplateResult } from "lit-html";
import type { ViewTabStyle } from "../../model/index.ts";
import {
  closeOverlay,
  openOverlay,
  openOverlayPanel,
  setActivePage,
  setViewTabStyle,
} from "../../state/index.ts";
import { announce } from "../../ui/announcer/index.ts";
import { linkToBlock, linkToPage } from "../../ui/address/index.ts";
import { COPY } from "../../ui/copy.ts";
import {
  renderMenu,
  renderMenuName,
  type MenuEntry,
  type MenuItem,
} from "../../ui/menu/index.ts";
import { LAYOUT_ICONS } from "./layout-icons.ts";
import type { TableContext } from "./table-cell.view.ts";
import { duplicateView } from "./view-duplicate.commands.ts";
import {
  isInsidePage,
  sourceItem,
  sourceTitleItem,
  sidebarItem,
} from "./view-tab-source.ts";
import { VIEW_SETTINGS_OVERLAY } from "./view-settings/index.ts";
import { deleteView, renameView } from "./view.commands.ts";

const STYLES: readonly ViewTabStyle[] = ["text-icon", "text", "icon"];
const RENAME_PANEL = "rename";

function showAsItem(context: TableContext): MenuItem {
  const { state, dispatch } = context;
  const current = state.workspace.settings.viewTabStyle ?? "text-icon";
  const items: MenuEntry[] = [
    ...STYLES.map((style): MenuItem => ({
      label: COPY.database.tabStyles[style],
      check: "radio",
      isChecked: style === current,
      onSelect: () => dispatch(setViewTabStyle.create({ style })),
    })),
    { kind: "divider" },
    { kind: "section", label: COPY.database.onlyForYou },
  ];
  return {
    label: COPY.database.displayAs,
    icon: "eye",
    submenu: {
      id: "view-tab-show-as",
      menu: () => ({ label: COPY.database.displayAs, items }),
    },
  };
}

// The address of the database the view belongs to: its page, or the
// block holding it on the open page.
function viewLink(context: TableContext): string {
  const { model, state } = context;
  const pageId = state.ui.activePageId;
  return pageId === null || pageId === model.holderId
    ? linkToPage(model.holderId)
    : linkToBlock(pageId, model.holderId);
}

function copyLink(context: TableContext): void {
  if (typeof navigator === "undefined" || !("clipboard" in navigator)) return;
  navigator.clipboard.writeText(viewLink(context)).then(
    () => {
      announce(COPY.database.viewLinkCopied);
    },
    () => undefined,
  );
}

function linkItems(context: TableContext): MenuItem[] {
  const { model, dispatch } = context;
  const isInside = isInsidePage(context);
  const full: MenuItem = {
    label: COPY.database.openFullPage,
    icon: "arrow-up-right",
    onSelect: () => dispatch(setActivePage.create({ pageId: model.holderId })),
  };
  return [
    {
      label: COPY.database.copyViewLink,
      icon: "link",
      onSelect: () => {
        copyLink(context);
      },
    },
    sidebarItem(context),
    ...(isInside ? [full, sourceTitleItem(context)] : []),
  ];
}

function viewItems(context: TableContext): MenuEntry[] {
  const { model, dispatch } = context;
  const viewId = model.view.id;
  const settings = { kind: VIEW_SETTINGS_OVERLAY, anchorId: model.holderId };
  const remove: MenuItem = {
    label: COPY.database.deleteView,
    icon: "trash",
    isDanger: true,
    onSelect: () => dispatch(deleteView.create({ viewId })),
  };
  return [
    {
      label: COPY.database.renameView,
      icon: "compose",
      keepsOpen: true,
      onSelect: () =>
        dispatch(openOverlayPanel.create({ panel: RENAME_PANEL })),
    },
    showAsItem(context),
    {
      label: COPY.database.editView,
      icon: "sliders",
      onSelect: () => dispatch(openOverlay.create({ overlay: settings })),
    },
    sourceItem(context),
    { kind: "divider" },
    ...linkItems(context),
    { kind: "divider" },
    {
      label: COPY.database.duplicateView,
      icon: "duplicate",
      onSelect: () => dispatch(duplicateView.create({ viewId })),
    },
    ...(model.viewIds.length > 1 ? [remove] : []),
    ...calendarItems(context),
  ];
}

// Rename shows the view's name as a field over the menu.
function renderRename(context: TableContext): TemplateResult {
  const { model, dispatch } = context;
  return html`${renderMenuName({
    icon: LAYOUT_ICONS[model.view.type],
    label: COPY.database.viewNameLabel,
    value: model.view.name,
    onRename: (name) =>
      dispatch(renameView.create({ viewId: model.view.id, name })),
  })}`;
}

export function renderViewTabMenu(context: TableContext): TemplateResult {
  const { state, dispatch } = context;
  const isRenaming = state.ui.overlay?.panel === RENAME_PANEL;
  return renderMenu({
    label: COPY.database.tabMenu,
    items: viewItems(context),
    onClose: () => dispatch(closeOverlay.create({})),
    context: { overlay: state.ui.overlay, dispatch },
    ...(isRenaming && { lead: renderRename(context) }),
  });
}
