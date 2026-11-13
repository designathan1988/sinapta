// A chart's layout settings, as Notion's: its type, the property along its
// X axis, and what its Y axis measures — the rows, or a number property
// summed, averaged, or at its least or most.
import type { ChartOptions } from "../../../model/index.ts";
import { COPY } from "../../../ui/copy.ts";
import type { MenuEntry } from "../../../ui/menu/index.ts";
import { chartAxisProperty } from "../chart-axis.ts";
import { setChartOptions } from "../chart-options.commands.ts";
import { propertyType } from "../property-registry.ts";
import { isGroupable } from "../row-groups.selectors.ts";
import type { TableContext } from "../table-cell.view.ts";
import { choiceItems, panelRow, type SettingsPanel } from "./settings-panel.ts";

import { propertyIcon } from "../table-model.selectors.ts";
const TEXT = COPY.database;
const KINDS = ["column", "bar", "line", "donut"] as const;
const AGGREGATES = ["sum", "average", "min", "max"] as const;
const COUNT = "count";

function set(context: TableContext, options: Partial<ChartOptions>): void {
  const viewId = context.model.view.id;
  context.dispatch(setChartOptions.create({ viewId, options }));
}

function numberProperties(context: TableContext) {
  return context.model.database.props.properties.filter(
    (property) => propertyType(property.type).editor === "number",
  );
}

// "Count", or "Sum of Points": what the Y axis measures.
function measureLabel(context: TableContext): string {
  const { aggregate, valuePropertyId } = context.model.view.chart;
  const value = numberProperties(context).find(
    (property) => property.id === valuePropertyId,
  );
  if (aggregate === COUNT || value === undefined) return TEXT.chartCount;
  return `${TEXT.chartAggregates[aggregate]} ${value.name}`;
}

export function chartItems(context: TableContext): MenuEntry[] {
  const { database, view } = context.model;
  const axis = chartAxisProperty(database, view);
  return [
    panelRow(
      context,
      { label: TEXT.chartKind, value: TEXT.chartKinds[view.chart.kind] },
      "chart-kind",
    ),
    panelRow(
      context,
      { label: TEXT.chartGroupBy, value: axis?.name ?? TEXT.noGrouping },
      "chart-x",
    ),
    panelRow(
      context,
      { label: TEXT.chartMeasure, value: measureLabel(context) },
      "chart-y",
    ),
  ];
}

export function chartKindPanel(context: TableContext): SettingsPanel {
  return {
    title: TEXT.chartKind,
    back: "layout",
    items: choiceItems(context, {
      choices: KINDS.map((kind) => ({
        value: kind,
        label: TEXT.chartKinds[kind],
      })),
      value: context.model.view.chart.kind,
      back: "layout",
      choose: (kind) => {
        set(context, { kind });
      },
    }),
  };
}

export function chartXPanel(context: TableContext): SettingsPanel {
  const { database, view } = context.model;
  const properties = database.props.properties.filter(isGroupable);
  return {
    title: TEXT.chartGroupBy,
    back: "layout",
    items: choiceItems(context, {
      choices: properties.map((property) => ({
        value: property.id,
        label: property.name,
        icon: propertyIcon(property),
      })),
      value: chartAxisProperty(database, view)?.id,
      back: "layout",
      choose: (id) => {
        const property = properties.find((item) => item.id === id);
        if (property !== undefined) {
          set(context, { groupByPropertyId: property.id });
        }
      },
    }),
  };
}

// "count", or an aggregate and a number property's id joined by ":".
export function chartYPanel(context: TableContext): SettingsPanel {
  const numbers = numberProperties(context);
  const { aggregate, valuePropertyId } = context.model.view.chart;
  const choices = [
    { value: COUNT, label: TEXT.chartCount },
    ...numbers.flatMap((property) =>
      AGGREGATES.map((kind) => ({
        value: `${kind}:${property.id}`,
        label: `${TEXT.chartAggregates[kind]} ${property.name}`,
      })),
    ),
  ];
  const current =
    aggregate === COUNT ? COUNT : `${aggregate}:${valuePropertyId ?? ""}`;
  return {
    title: TEXT.chartMeasure,
    back: "layout",
    items: choiceItems(context, {
      choices,
      value: current,
      back: "layout",
      choose: (value) => {
        const [kind, id] = value.split(":");
        const property = numbers.find((item) => item.id === id);
        const measure = AGGREGATES.find((item) => item === kind);
        if (measure === undefined || property === undefined) {
          set(context, { aggregate: COUNT });
        } else {
          set(context, { aggregate: measure, valuePropertyId: property.id });
        }
      },
    }),
  };
}
