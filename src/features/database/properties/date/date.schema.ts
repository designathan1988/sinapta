// A date property's config: how its days and times are written.
import * as v from "valibot";

export const DATE_FORMATS = [
  "medium",
  "full",
  "month-day-year",
  "day-month-year",
  "year-month-day",
] as const;
export const TIME_FORMATS = ["12-hour", "24-hour"] as const;

export const dateConfigSchema = v.object({
  dateFormat: v.picklist(DATE_FORMATS),
  timeFormat: v.picklist(TIME_FORMATS),
});

export type DateConfig = v.InferOutput<typeof dateConfigSchema>;
export type DateFormat = DateConfig["dateFormat"];

export const DEFAULT_DATE_CONFIG: DateConfig = {
  dateFormat: "medium",
  timeFormat: "12-hour",
};

// The config held in memory, already checked on load, read with its type.
export function readDateConfig(config: unknown): DateConfig {
  return v.is(dateConfigSchema, config) ? config : DEFAULT_DATE_CONFIG;
}
