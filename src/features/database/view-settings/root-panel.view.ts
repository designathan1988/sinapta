// The first panel of the view settings: the view's name, then a row per
// setting with its current value, and the view's own actions.
import { exportViewAsCsv } from "../csv-file.view.ts";
import type { TemplateResult } from "lit-html";
import type { ViewType } from "../../../model/index.ts";
import { openOverlay } from "../../../state/index.ts";
import { COPY } from "../../../ui/copy.ts";
import type { IconName } from "../../../ui/icon/index.ts";
import { renderMenuName, type MenuEntry } from "../../../ui/menu/index.ts";
import { filterCount } from "../filter-match.ts";
import type { TableContext } from "../table-cell.view.ts";
import { FILTERS_OVERLAY } from "../view-filters.view.ts";
import { deleteView, renameView } from "../view.commands.ts";
import { panelRow, type SettingsPanel } from "./settings-panel.ts";

export const LAYOUT_ICONS: Readonly<Record<ViewType, IconName>> = {
  table: "table",
  board: "board",
  gallery: "gallery",
  list: "list",
  calendar: "calendar",
  timeline: "timeline",
  chart: "chart",
  form: "form",
  feed: "feed",
};

function renderName(context: TableContext): TemplateResult {
  const { model, dispatch } = context;
  // An empty name, which would leave a tab with nothing to press, puts
  // the old one back.
  return renderMenuName({
    icon: LAYOUT_ICONS[model.view.type],
    label: COPY.database.viewNameLabel,
    value: model.view.name,
    onRename: (name) =>
      dispatch(renameView.create({ viewId: model.view.id, name })),
  });
}

// Exporting the view as CSV; deleting it, while the database keeps
// another, since it keeps at least one.
function viewActions(context: TableContext): MenuEntry[] {
  const { model, dispatch } = context;
  const exportItem: MenuEntry = {
    label: COPY.database.exportCsv,
    icon: "download",
    onSelect: () => {
      exportViewAsCsv(model);
    },
  };
  if (model.viewIds.length < 2) return [{ kind: "divider" }, exportItem];
  return [
    { kind: "divider" },
    exportItem,
    {
      label: COPY.database.deleteView,
      icon: "trash",
      isDanger: true,
      onSelect: () => dispatch(deleteView.create({ viewId: model.view.id })),
    },
  ];
}

function filterRow(context: TableContext): MenuEntry {
  const { model, dispatch } = context;
  const count = filterCount(model.view.filter);
  const overlay = { kind: FILTERS_OVERLAY, anchorId: model.holderId };
  return {
    label: COPY.database.filter,
    icon: "filter",
    ...(count > 0 && { value: String(count) }),
    onSelect: () => dispatch(openOverlay.create({ overlay })),
  };
}

function settingRows(context: TableContext): MenuEntry[] {
  const { view, database } = context.model;
  const { layouts } = COPY.database;
  const shown = database.props.properties.filter(
    (property) => !view.hiddenPropertyIds.includes(property.id),
  ).length;
  const grouped = database.props.properties.find(
    (property) => property.id === view.groupBy?.propertyId,
  );
  const layout = {
    label: COPY.database.layout,
    icon: LAYOUT_ICONS[view.type],
    value: layouts[view.type],
  };
  const visibility = {
    label: COPY.database.propertyVisibility,
    icon: "eye" as const,
    value: String(shown),
  };
  const group = {
    label: COPY.database.group,
    icon: "group" as const,
    value: grouped?.name ?? COPY.database.noGrouping,
  };
  // With no sort, the Sort row goes straight to choosing one, as Notion's.
  const sortCount = view.sorts.length;
  const sort = {
    label: COPY.database.sort,
    icon: "sort" as const,
    ...(sortCount > 0 && { value: String(sortCount) }),
  };
  return [
    panelRow(context, layout, "layout"),
    panelRow(context, visibility, "properties"),
    filterRow(context),
    panelRow(context, sort, sortCount > 0 ? "sort" : "sort-add"),
    // A calendar places rows by date and does not group them.
    ...(view.type === "calendar" ? [] : [panelRow(context, group, "group")]),
  ];
}

export function rootPanel(context: TableContext): SettingsPanel {
  return {
    title: COPY.database.viewSettings,
    items: [...settingRows(context), ...viewActions(context)],
    lead: renderName(context),
  };
}
