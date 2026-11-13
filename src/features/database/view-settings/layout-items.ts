// Each layout's own rows in the layout panel, as Notion's: a board's and
// a gallery's cards (preview, size, fit media, and the card layout's two
// tiles under the rows), a calendar's days and wrapped titles, a
// timeline's dates, a list's titles edited in place and a feed's
// wrapped values.
import { html, type TemplateResult } from "lit-html";
import {
  DEFAULT_CARD_OPTIONS,
  type CalendarOptions,
  type CardOptions,
  type TimelineOptions,
} from "../../../model/index.ts";
import { COPY } from "../../../ui/copy.ts";
import type { MenuEntry, MenuItem } from "../../../ui/menu/index.ts";
import { renderTiles } from "../../../ui/tiles/index.ts";
import { setCalendarOptions } from "../calendar-options.commands.ts";
import { setCardOptions } from "../card.commands.ts";
import {
  DEFAULT_FEED_OPTIONS,
  setFeedOptions,
} from "../feed-options.commands.ts";
import {
  DEFAULT_LIST_OPTIONS,
  setListOptions,
} from "../list-options.commands.ts";
import type { TableContext } from "../table-cell.view.ts";
import { setTimelineOptions } from "../timeline-options.commands.ts";
import { choiceItems, panelRow, type SettingsPanel } from "./settings-panel.ts";

function toggle(label: string, isOn: boolean, onSelect: () => void): MenuItem {
  return { label, check: "switch", isChecked: isOn, onSelect };
}

function setCard(context: TableContext, card: Partial<CardOptions>): void {
  const viewId = context.model.view.id;
  context.dispatch(setCardOptions.create({ viewId, options: { card } }));
}

export function cardItems(context: TableContext): MenuEntry[] {
  const { view } = context.model;
  const { cardPreviews, cardSizes } = COPY.database;
  const card = view.card ?? DEFAULT_CARD_OPTIONS;
  const viewId = view.id;
  const colorColumns = toggle(
    COPY.database.colorColumns,
    view.colorColumns,
    () =>
      context.dispatch(
        setCardOptions.create({
          viewId,
          options: { colorColumns: !view.colorColumns },
        }),
      ),
  );
  const fitMedia = toggle(COPY.database.fitMedia, card.fitMedia, () => {
    setCard(context, { fitMedia: !card.fitMedia });
  });
  const preview = {
    label: COPY.database.cardPreview,
    value: cardPreviews[view.cardPreview],
  };
  const size = {
    label: COPY.database.cardSize,
    value: cardSizes[view.cardSize],
  };
  return [
    panelRow(context, preview, "card-preview"),
    panelRow(context, size, "card-size"),
    view.type === "board" ? colorColumns : fitMedia,
  ];
}

// The card layout's pictures, as Notion's: a dot and short dashes side by
// side (Compact), or a dot over stacked lines (List).
function cardPicture(layout: CardOptions["layout"]): TemplateResult {
  const lines = layout === "compact" ? [3, 2] : [1, 1, 1];
  return html`<span class="view-settings__card" data-layout=${layout}>
    <span class="view-settings__card-dot"></span>
    ${lines.map(
      (count) =>
        html`<span class="view-settings__card-line"
          >${Array.from({ length: count }, () => html`<span></span>`)}</span
        >`,
    )}
  </span>`;
}

export function renderCardLayout(context: TableContext): TemplateResult {
  const card = context.model.view.card ?? DEFAULT_CARD_OPTIONS;
  const { cardLayouts } = COPY.database;
  return html`<div class="view-settings__box">
    <p class="view-settings__box-title">${COPY.database.cardLayout}</p>
    ${renderTiles({
      label: COPY.database.cardLayout,
      tiles: (["compact", "list"] as const).map((value) => ({
        value,
        picture: cardPicture(value),
        label: cardLayouts[value],
      })),
      current: card.layout,
      onPick: (layout) => {
        setCard(context, { layout });
      },
    })}
  </div>`;
}

// A timeline's date property, its end when dates are separate, and its
// table beside, as Notion's.
export function timelineItems(context: TableContext): MenuEntry[] {
  const { view, database } = context.model;
  const dates = database.props.properties.filter(
    (item) => item.type === "date",
  );
  const nameOf = (id: string | undefined) =>
    dates.find((property) => property.id === id)?.name;
  const { showTable, separateDates = false, endDatePropertyId } = view.timeline;
  const set = (options: Partial<TimelineOptions>) => (): void => {
    context.dispatch(setTimelineOptions.create({ viewId: view.id, options }));
  };
  const start = nameOf(view.timeline.datePropertyId) ?? dates[0]?.name;
  const startRow = {
    label: COPY.database.showTimelineBy,
    icon: "calendar",
    value: start ?? COPY.database.noGrouping,
  } as const;
  const endRow = {
    label: COPY.database.endDateProperty,
    icon: "calendar",
    value: nameOf(endDatePropertyId) ?? COPY.database.noGrouping,
  } as const;
  return [
    panelRow(context, startRow, "timeline-date"),
    toggle(
      COPY.database.separateDates,
      separateDates,
      set({ separateDates: !separateDates }),
    ),
    ...(separateDates ? [panelRow(context, endRow, "timeline-end")] : []),
    toggle(COPY.database.showTable, showTable, set({ showTable: !showTable })),
  ];
}

// How a calendar shows its days, as Notion's: by month or by week, with
// or without weekends, from Sunday or Monday, titles cut or wrapped.
export function calendarItems(context: TableContext): MenuEntry[] {
  const { view } = context.model;
  const { calendar } = view;
  const set = (options: Partial<CalendarOptions>) => (): void => {
    context.dispatch(setCalendarOptions.create({ viewId: view.id, options }));
  };
  const mode = {
    label: COPY.database.calendarAs,
    value: COPY.database.calendarModes[calendar.mode],
  };
  const wrap = calendar.wrapTitles === true;
  return [
    panelRow(context, mode, "calendar-mode"),
    toggle(
      COPY.database.showWeekends,
      calendar.showWeekends,
      set({ showWeekends: !calendar.showWeekends }),
    ),
    toggle(
      COPY.database.weekStartsMonday,
      calendar.weekStartsOn === 1,
      set({ weekStartsOn: calendar.weekStartsOn === 1 ? 0 : 1 }),
    ),
    toggle(COPY.database.wrapTitles, wrap, set({ wrapTitles: !wrap })),
  ];
}

export function listItems(context: TableContext): MenuEntry[] {
  const { view } = context.model;
  const { editTitle } = view.list ?? DEFAULT_LIST_OPTIONS;
  return [
    toggle(COPY.database.editTitle, editTitle, () =>
      context.dispatch(
        setListOptions.create({
          viewId: view.id,
          options: { editTitle: !editTitle },
        }),
      ),
    ),
  ];
}

export function feedItems(context: TableContext): MenuEntry[] {
  const { view } = context.model;
  const { wrapProperties } = view.feed ?? DEFAULT_FEED_OPTIONS;
  return [
    toggle(COPY.database.wrapProperties, wrapProperties, () =>
      context.dispatch(
        setFeedOptions.create({
          viewId: view.id,
          options: { wrapProperties: !wrapProperties },
        }),
      ),
    ),
  ];
}

// The date property a timeline's bars end on, when its dates are separate.
export function timelineEndPanel(context: TableContext): SettingsPanel {
  const { model, dispatch } = context;
  const dates = model.database.props.properties.filter(
    (item) => item.type === "date",
  );
  const viewId = model.view.id;
  return {
    title: COPY.database.endDateProperty,
    back: "layout",
    items: choiceItems(context, {
      choices: dates.map((date) => ({ value: date.id, label: date.name })),
      value: model.view.timeline.endDatePropertyId,
      back: "layout",
      choose: (id) => {
        const date = dates.find((item) => item.id === id);
        if (date === undefined) return;
        const options = { endDatePropertyId: date.id };
        dispatch(setTimelineOptions.create({ viewId, options }));
      },
    }),
  };
}
