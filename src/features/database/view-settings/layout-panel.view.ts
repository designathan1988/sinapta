// The layout panel: a tile per layout, the chosen one ringed in blue,
// then the chosen layout's own settings.
import { setTimelineOptions } from "../timeline-options.commands.ts";
import type { CalendarOptions } from "../../../model/index.ts";
import { setCalendarOptions } from "../calendar-options.commands.ts";
import { html, type TemplateResult } from "lit-html";
import { VIEW_TYPES } from "../../../model/index.ts";
import { COPY } from "../../../ui/copy.ts";
import { renderIcon } from "../../../ui/icon/index.ts";
import type { MenuEntry } from "../../../ui/menu/index.ts";
import { setCardOptions } from "../card.commands.ts";
import type { TableContext } from "../table-cell.view.ts";
import { setViewType } from "../view-layout.commands.ts";
import { LAYOUT_ICONS } from "./root-panel.view.ts";
import { panelRow, type SettingsPanel } from "./settings-panel.ts";

function renderTiles(context: TableContext): TemplateResult {
  const { model, dispatch } = context;
  const viewId = model.view.id;
  return html`<div
    class="view-settings__tiles"
    role="group"
    aria-label=${COPY.database.layout}
  >
    ${VIEW_TYPES.map(
      (viewType) =>
        html`<button
          type="button"
          class="view-settings__tile"
          aria-pressed=${String(viewType === model.view.type)}
          @click=${() => dispatch(setViewType.create({ viewId, viewType }))}
        >
          ${renderIcon(LAYOUT_ICONS[viewType])}
          <span>${COPY.database.layouts[viewType]}</span>
        </button>`,
    )}
  </div>`;
}

function cardItems(context: TableContext): MenuEntry[] {
  const { view } = context.model;
  const { cardPreviews, cardSizes } = COPY.database;
  const colorColumns: MenuEntry = {
    label: COPY.database.colorColumns,
    check: "switch",
    isChecked: view.colorColumns,
    onSelect: () =>
      context.dispatch(
        setCardOptions.create({
          viewId: view.id,
          options: { colorColumns: !view.colorColumns },
        }),
      ),
  };
  return [
    panelRow(
      context,
      {
        label: COPY.database.cardPreview,
        value: cardPreviews[view.cardPreview],
      },
      "card-preview",
    ),
    panelRow(
      context,
      { label: COPY.database.cardSize, value: cardSizes[view.cardSize] },
      "card-size",
    ),
    ...(view.type === "board" ? [colorColumns] : []),
  ];
}

// A timeline's date property and its table beside, as Notion's.
function timelineItems(context: TableContext): MenuEntry[] {
  const { view, database } = context.model;
  const dates = database.props.properties.filter(
    (property) => property.type === "date",
  );
  const date =
    dates.find((property) => property.id === view.timeline.datePropertyId) ??
    dates[0];
  const { showTable } = view.timeline;
  return [
    panelRow(
      context,
      {
        label: COPY.database.showTimelineBy,
        icon: "calendar",
        value: date?.name ?? COPY.database.noGrouping,
      },
      "timeline-date",
    ),
    {
      label: COPY.database.showTable,
      check: "switch",
      isChecked: showTable,
      onSelect: () =>
        context.dispatch(
          setTimelineOptions.create({
            viewId: view.id,
            options: { showTable: !showTable },
          }),
        ),
    },
  ];
}

function layoutItems(context: TableContext): MenuEntry[] {
  const { view, database } = context.model;
  if (view.type === "board" || view.type === "gallery") {
    return cardItems(context);
  }
  if (view.type === "timeline") return timelineItems(context);
  if (view.type !== "calendar") return [];
  const date = database.props.properties.find(
    (property) => property.id === view.datePropertyId,
  );
  return [
    panelRow(
      context,
      {
        label: COPY.database.calendarBy,
        icon: "calendar",
        value: date?.name ?? COPY.database.noGrouping,
      },
      "calendar-date",
    ),
    ...calendarItems(context),
  ];
}

// How a calendar shows its days, as Notion's layout settings: by month or
// by week, with or without weekends, from Sunday or Monday.
function calendarItems(context: TableContext): MenuEntry[] {
  const { view } = context.model;
  const { calendar } = view;
  const set = (options: Partial<CalendarOptions>) => (): void => {
    context.dispatch(setCalendarOptions.create({ viewId: view.id, options }));
  };
  return [
    panelRow(
      context,
      {
        label: COPY.database.calendarAs,
        value: COPY.database.calendarModes[calendar.mode],
      },
      "calendar-mode",
    ),
    {
      label: COPY.database.showWeekends,
      check: "switch",
      isChecked: calendar.showWeekends,
      onSelect: set({ showWeekends: !calendar.showWeekends }),
    },
    {
      label: COPY.database.weekStartsMonday,
      check: "switch",
      isChecked: calendar.weekStartsOn === 1,
      onSelect: set({ weekStartsOn: calendar.weekStartsOn === 1 ? 0 : 1 }),
    },
  ];
}

export function layoutPanel(context: TableContext): SettingsPanel {
  return {
    title: COPY.database.layout,
    back: null,
    lead: renderTiles(context),
    items: layoutItems(context),
  };
}
