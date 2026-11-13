// The panels that change one setting by choosing among its options:
// what to group by, how groups sort, how dates group, a card's picture
// and size, and a calendar's date property; and the panel that shows and
// hides properties.
import { setTimelineOptions } from "../timeline-options.commands.ts";
import { setCalendarOptions } from "../calendar-options.commands.ts";
import { setOpenMode } from "../row-open.commands.ts";
import type { GroupBy, View } from "../../../model/index.ts";
import { COPY } from "../../../ui/copy.ts";
import { setCardOptions, type CardOptions } from "../card.commands.ts";
import { setGroupOptions, type GroupOptions } from "../group.commands.ts";
import { propertyType } from "../property-registry.ts";
import type { TableContext } from "../table-cell.view.ts";
import {
  DATE_PROPERTY_TYPES,
  propertiesOfTypes,
  setViewDateProperty,
} from "../view-layout.commands.ts";
import { togglePropertyHidden } from "../view.commands.ts";
import { groupByItems } from "./group-panel.ts";
import { choiceItems, type SettingsPanel } from "./settings-panel.ts";

export const GROUP_SORTS: readonly GroupBy["sort"][] = [
  "manual",
  "ascending",
  "descending",
];
const STEPS: readonly GroupBy["dateBy"][] = ["day", "week", "month", "year"];
const PREVIEWS: readonly View["cardPreview"][] = ["none", "cover", "content"];
const SIZES: readonly View["cardSize"][] = ["small", "medium", "large"];

function groupOptions(context: TableContext) {
  return (options: GroupOptions): void => {
    const viewId = context.model.view.id;
    context.dispatch(setGroupOptions.create({ viewId, options }));
  };
}

function cardOptions(context: TableContext) {
  return (options: CardOptions): void => {
    const viewId = context.model.view.id;
    context.dispatch(setCardOptions.create({ viewId, options }));
  };
}

export function groupByPanel(context: TableContext): SettingsPanel {
  return {
    title: COPY.database.groupBy,
    back: "group",
    search: COPY.database.searchProperty,
    items: groupByItems(context),
  };
}

export function groupSortPanel(context: TableContext): SettingsPanel {
  const labels = COPY.database.groupSorts;
  const choices = GROUP_SORTS.map((value) => ({ value, label: labels[value] }));
  const set = groupOptions(context);
  return {
    title: COPY.database.sortRow,
    back: "group",
    items: choiceItems(context, {
      choices,
      value: context.model.view.groupBy?.sort,
      back: "group",
      choose: (sort) => {
        set({ sort });
      },
    }),
  };
}

export function groupDatePanel(context: TableContext): SettingsPanel {
  const labels = COPY.database.dateSteps;
  const set = groupOptions(context);
  return {
    title: COPY.database.dateStep,
    back: "group",
    items: choiceItems(context, {
      choices: STEPS.map((value) => ({ value, label: labels[value] })),
      value: context.model.view.groupBy?.dateBy,
      back: "group",
      choose: (dateBy) => {
        set({ dateBy });
      },
    }),
  };
}

export function cardPreviewPanel(context: TableContext): SettingsPanel {
  const labels = COPY.database.cardPreviews;
  const set = cardOptions(context);
  return {
    title: COPY.database.cardPreview,
    back: "layout",
    items: choiceItems(context, {
      choices: PREVIEWS.map((value) => ({ value, label: labels[value] })),
      value: context.model.view.cardPreview,
      back: "layout",
      choose: (cardPreview) => {
        set({ cardPreview });
      },
    }),
  };
}

export function cardSizePanel(context: TableContext): SettingsPanel {
  const labels = COPY.database.cardSizes;
  const set = cardOptions(context);
  return {
    title: COPY.database.cardSize,
    back: "layout",
    items: choiceItems(context, {
      choices: SIZES.map((value) => ({ value, label: labels[value] })),
      value: context.model.view.cardSize,
      back: "layout",
      choose: (cardSize) => {
        set({ cardSize });
      },
    }),
  };
}

export function calendarDatePanel(context: TableContext): SettingsPanel {
  const { model, dispatch } = context;
  const dates = propertiesOfTypes(model.database, DATE_PROPERTY_TYPES);
  return {
    title: COPY.database.calendarBy,
    back: "layout",
    items: choiceItems(context, {
      choices: dates.map((date) => ({ value: date.id, label: date.name })),
      value: model.view.datePropertyId,
      back: "layout",
      choose: (id) => {
        const date = dates.find((item) => item.id === id);
        if (date === undefined) return;
        const viewId = model.view.id;
        dispatch(setViewDateProperty.create({ viewId, propertyId: date.id }));
      },
    }),
  };
}

// A calendar by month or by week.
export function calendarModePanel(context: TableContext): SettingsPanel {
  const { model, dispatch } = context;
  const modes = COPY.database.calendarModes;
  return {
    title: COPY.database.calendarAs,
    back: "layout",
    items: choiceItems(context, {
      choices: (["month", "week"] as const).map((value) => ({
        value,
        label: modes[value],
      })),
      value: model.view.calendar.mode,
      back: "layout",
      choose: (mode) => {
        const viewId = model.view.id;
        dispatch(setCalendarOptions.create({ viewId, options: { mode } }));
      },
    }),
  };
}

export const OPEN_MODE_ICONS = {
  side: "peek-side",
  center: "peek-center",
  full: "peek-full",
} as const;

// Where the view opens its rows: in a side or center peek, or as a page.
export function openModePanel(context: TableContext): SettingsPanel {
  const { model, dispatch } = context;
  return {
    title: COPY.database.openPagesIn,
    back: "layout",
    items: choiceItems(context, {
      choices: (["side", "center", "full"] as const).map((value) => ({
        value,
        label: COPY.peek.modes[value],
        icon: OPEN_MODE_ICONS[value],
      })),
      value: model.view.openMode,
      back: "layout",
      choose: (openMode) => {
        dispatch(setOpenMode.create({ viewId: model.view.id, openMode }));
      },
    }),
  };
}

// The date property a timeline places its bars by.
export function timelineDatePanel(context: TableContext): SettingsPanel {
  const { model, dispatch } = context;
  const dates = propertiesOfTypes(model.database, DATE_PROPERTY_TYPES);
  const viewId = model.view.id;
  return {
    title: COPY.database.showTimelineBy,
    back: "layout",
    items: choiceItems(context, {
      choices: dates.map((date) => ({ value: date.id, label: date.name })),
      value: model.view.timeline.datePropertyId ?? dates[0]?.id,
      back: "layout",
      choose: (id) => {
        const date = dates.find((item) => item.id === id);
        if (date === undefined) return;
        const options = { datePropertyId: date.id };
        dispatch(setTimelineOptions.create({ viewId, options }));
      },
    }),
  };
}

// Each property with an eye: open when the view shows it.
export function propertiesPanel(context: TableContext): SettingsPanel {
  const { model, dispatch } = context;
  const viewId = model.view.id;
  const items = model.database.props.properties.map((property) => {
    const isHidden = model.view.hiddenPropertyIds.includes(property.id);
    return {
      label: property.name,
      icon: propertyType(property.type).icon,
      endIcon: isHidden ? ("eye-off" as const) : ("eye" as const),
      keepsOpen: true,
      onSelect: () =>
        dispatch(
          togglePropertyHidden.create({ viewId, propertyId: property.id }),
        ),
    };
  });
  return {
    title: COPY.database.propertyVisibility,
    back: null,
    search: COPY.database.searchProperty,
    items,
  };
}
