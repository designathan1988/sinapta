// What a chart shows, as Notion's: the view's rows grouped by a property,
// each group measured by its rows or by a number property summed,
// averaged, or at its least or most. Groups without rows are left out.
import type { PropertyDefinition } from "../../../../blocks/database/index.ts";
import type { ChartOptions } from "../../../../model/index.ts";
import { groupByProperty } from "../../group.commands.ts";
import { propertyType } from "../../property-registry.ts";
import { chartAxisProperty } from "../../chart-axis.ts";
import { groupRowsBy } from "../../row-groups.selectors.ts";
import type { TableModel, TableRow } from "../../table-model.selectors.ts";

export interface ChartPoint {
  readonly key: string;
  readonly label: string;
  readonly color?: string;
  readonly value: number;
}

export interface Chart {
  readonly property: PropertyDefinition;
  readonly points: readonly ChartPoint[];
  // The largest value, and all of them together, for scales and shares.
  readonly max: number;
  readonly total: number;
}

function numbersOf(rows: readonly TableRow[], propertyId: string): number[] {
  return rows.flatMap((row) => {
    const value = row.values[propertyId];
    return typeof value === "number" && Number.isFinite(value) ? [value] : [];
  });
}

const MEASURES: Readonly<
  Record<
    Exclude<ChartOptions["aggregate"], "count">,
    (values: number[]) => number
  >
> = {
  sum: (values) => values.reduce((sum, value) => sum + value, 0),
  average: (values) =>
    values.length === 0
      ? 0
      : values.reduce((sum, value) => sum + value, 0) / values.length,
  min: (values) => (values.length === 0 ? 0 : Math.min(...values)),
  max: (values) => (values.length === 0 ? 0 : Math.max(...values)),
};

function measure(rows: readonly TableRow[], model: TableModel): number {
  const { aggregate, valuePropertyId } = model.view.chart;
  const value = model.database.props.properties.find(
    (item) => item.id === valuePropertyId,
  );
  if (aggregate === "count" || value === undefined) return rows.length;
  if (propertyType(value.type).editor !== "number") return rows.length;
  return MEASURES[aggregate](numbersOf(rows, value.id));
}

export function selectChart(model: TableModel): Chart | undefined {
  const property = chartAxisProperty(model.database, model.view);
  if (property === undefined) return undefined;
  const grouped = groupRowsBy(model, groupByProperty(property.id));
  if (grouped === undefined) return undefined;
  const points = grouped.groups
    .filter((group) => group.rows.length > 0)
    .map((group) => ({
      key: group.key,
      label: group.label,
      ...(group.color !== undefined && { color: group.color }),
      value: measure(group.rows, model),
    }));
  const values = points.map((point) => point.value);
  return {
    property,
    points,
    max: Math.max(0, ...values),
    total: values.reduce((sum, value) => sum + value, 0),
  };
}
