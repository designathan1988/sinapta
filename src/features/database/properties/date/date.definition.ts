// A date property holds a day, or a range of days, with an optional time.
import type { PropertyType } from "../../property-definition.ts";
import { renderDateConfig } from "./date-config.view.ts";
import { DATE_FILTERS } from "./date-filters.ts";
import {
  formatDateValue,
  isDay,
  readDateValue,
  type DateValue,
} from "./date-value.ts";
import {
  dateConfigSchema,
  DEFAULT_DATE_CONFIG,
  readDateConfig,
} from "./date.schema.ts";

// A typed day replaces the first day; the end and the time stay when they
// still fit.
function parseDate(text: string, previous?: unknown): DateValue | undefined {
  const start = text.trim();
  if (!isDay(start)) return undefined;
  const old = readDateValue(previous);
  const end = old?.end !== undefined && old.end >= start ? old.end : undefined;
  return {
    start,
    ...(end !== undefined && { end }),
    ...(old?.time !== undefined && { time: old.time }),
  };
}

function compareDates(a: unknown, b: unknown): number {
  const first = readDateValue(a);
  const second = readDateValue(b);
  const starts = (first?.start ?? "").localeCompare(second?.start ?? "");
  return starts || (first?.end ?? "").localeCompare(second?.end ?? "");
}

export const dateProperty: PropertyType = {
  type: "date",
  label: "Date",
  icon: "calendar",
  editor: "date",
  input: { type: "date" },
  read: readDateValue,
  parse: parseDate,
  // The first day, as the day field edits it and search finds it.
  format: (value) => readDateValue(value)?.start ?? "",
  compare: compareDates,
  filterOperators: DATE_FILTERS,
  renderCell(value, property) {
    const date = readDateValue(value);
    if (date === undefined) return "";
    return formatDateValue(date, readDateConfig(property.config));
  },
  configSchema: dateConfigSchema,
  defaultConfig: () => DEFAULT_DATE_CONFIG,
  renderConfigEditor: renderDateConfig,
};
