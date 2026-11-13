// The layout panel: a tile per layout, the chosen one ringed in blue,
// then the chosen layout's own settings.
import { chartItems } from "./chart-panels.ts";
import {
  DEFAULT_TABLE_OPTIONS,
  type TableOptions,
  type ViewType,
} from "../../../model/index.ts";
import {
  calendarItems,
  cardItems,
  feedItems,
  listItems,
  renderCardLayout,
  timelineItems,
} from "./layout-items.ts";
import type { TemplateResult } from "lit-html";
import { VIEW_TYPES } from "../../../model/index.ts";
import { COPY } from "../../../ui/copy.ts";
import { renderIcon } from "../../../ui/icon/index.ts";
import type { MenuEntry } from "../../../ui/menu/index.ts";
import { renderTiles } from "../../../ui/tiles/index.ts";
import { setTableOptions } from "../table-layout.commands.ts";
import type { TableContext } from "../table-cell.view.ts";
import { setViewType } from "../view-layout.commands.ts";
import { LAYOUT_ICONS } from "../layout-icons.ts";
import { OPEN_MODE_ICONS } from "./choice-panels.ts";
import { showSourceTitleItem } from "../view-tab-source.ts";
import { panelRow, type SettingsPanel } from "./settings-panel.ts";

function renderLayoutTiles(context: TableContext): TemplateResult {
  const { model, dispatch } = context;
  const viewId = model.view.id;
  return renderTiles({
    label: COPY.database.layout,
    tiles: VIEW_TYPES.map((viewType) => ({
      value: viewType,
      picture: renderIcon(LAYOUT_ICONS[viewType]),
      label: COPY.database.layouts[viewType],
    })),
    current: model.view.type,
    onPick: (viewType) => dispatch(setViewType.create({ viewId, viewType })),
  });
}

// A table's layout switches, as Notion's.
function tableItems(context: TableContext): MenuEntry[] {
  const { view } = context.model;
  const table = view.table ?? DEFAULT_TABLE_OPTIONS;
  const toggle = (key: keyof TableOptions): MenuEntry => ({
    label: COPY.database[key],
    check: "switch",
    isChecked: table[key],
    onSelect: () =>
      context.dispatch(
        setTableOptions.create({
          viewId: view.id,
          options: { [key]: !table[key] },
        }),
      ),
  });
  return [toggle("verticalLines"), toggle("pageIcons"), toggle("wrapAll")];
}

function calendarRows(context: TableContext): MenuEntry[] {
  const { view, database } = context.model;
  const date = database.props.properties.find(
    (property) => property.id === view.datePropertyId,
  );
  const row = {
    label: COPY.database.calendarBy,
    icon: "calendar",
    value: date?.name ?? COPY.database.noGrouping,
  } as const;
  return [panelRow(context, row, "calendar-date"), ...calendarItems(context)];
}

// Each layout's own rows.
const TYPE_ITEMS: Partial<
  Record<ViewType, (context: TableContext) => MenuEntry[]>
> = {
  table: tableItems,
  board: cardItems,
  gallery: cardItems,
  timeline: timelineItems,
  list: listItems,
  feed: feedItems,
  chart: chartItems,
  calendar: calendarRows,
};

function typeItems(context: TableContext): MenuEntry[] {
  return TYPE_ITEMS[context.model.view.type]?.(context) ?? [];
}

// Where the view opens its rows, as Notion's "Open pages in"; a chart and
// a form show no rows to open.
function openModeItems(context: TableContext): MenuEntry[] {
  const { view } = context.model;
  if (view.type === "chart" || view.type === "form") return [];
  const value = COPY.peek.modes[view.openMode];
  const icon = OPEN_MODE_ICONS[view.openMode];
  const row = { label: COPY.database.openPagesIn, icon, value };
  return [panelRow(context, row, "open-mode")];
}

function layoutItems(context: TableContext): MenuEntry[] {
  return [
    ...showSourceTitleItem(context),
    ...typeItems(context),
    ...openModeItems(context),
  ];
}

function isCardLayout(context: TableContext): boolean {
  const { type } = context.model.view;
  return type === "board" || type === "gallery";
}

export function layoutPanel(context: TableContext): SettingsPanel {
  return {
    title: COPY.database.layout,
    back: null,
    lead: renderLayoutTiles(context),
    ...(isCardLayout(context) && { tail: renderCardLayout(context) }),
    items: layoutItems(context),
  };
}
