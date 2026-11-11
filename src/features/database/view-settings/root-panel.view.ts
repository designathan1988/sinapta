// The first panel of the view settings: the view's name, then a row per
// setting with its current value, and the view's own actions.
import { html, type TemplateResult } from "lit-html";
import type { ViewType } from "../../../model/index.ts";
import { openOverlay } from "../../../state/index.ts";
import { COPY } from "../../../ui/copy.ts";
import { renderIcon, type IconName } from "../../../ui/icon/index.ts";
import type { MenuEntry } from "../../../ui/menu/index.ts";
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
};

function renderName(context: TableContext): TemplateResult {
  const { model, dispatch } = context;
  // An empty name would leave a tab with nothing to press.
  const rename = (event: Event): void => {
    if (!(event.target instanceof HTMLInputElement)) return;
    const name = event.target.value.trim();
    if (name === "") event.target.value = model.view.name;
    else dispatch(renameView.create({ viewId: model.view.id, name }));
  };
  return html`<label class="menu__field view-settings__name">
    ${renderIcon(LAYOUT_ICONS[model.view.type])}
    <input
      type="text"
      aria-label=${COPY.database.viewNameLabel}
      .value=${model.view.name}
      @change=${rename}
    />
  </label>`;
}

// A database keeps at least one view, so the last one cannot be deleted.
function viewActions(context: TableContext): MenuEntry[] {
  const { model, dispatch } = context;
  if (model.viewIds.length < 2) return [];
  return [
    { kind: "divider" },
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
  return [
    panelRow(context, layout, "layout"),
    panelRow(context, visibility, "properties"),
    filterRow(context),
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
