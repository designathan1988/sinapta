// A date property's config: how its days and times are written.
import * as v from "valibot";

// Notion's date formats, in its order (n74-relative-code: "ll", "MMM d",
// "MM/DD/YYYY", "DD/MM/YYYY", "YYYY/MM/DD", "relative").
export const DATE_FORMATS = [
  "full",
  "short",
  "month-day-year",
  "day-month-year",
  "year-month-day",
  "relative",
] as const;
// Notion's time formats, in its order: "hidden", "12h", "24h".
export const TIME_FORMATS = ["hidden", "12-hour", "24-hour"] as const;

// The old "medium" (Nov 10, 2026) is read as Full date, as Notion reads
// its old "MMM DD, YYYY".
export const dateConfigSchema = v.object({
  dateFormat: v.pipe(
    v.picklist([...DATE_FORMATS, "medium"]),
    v.transform((format) => (format === "medium" ? "full" : format)),
  ),
  timeFormat: v.picklist(TIME_FORMATS),
});

export type DateConfig = v.InferOutput<typeof dateConfigSchema>;
export type DateFormat = DateConfig["dateFormat"];

export const DEFAULT_DATE_CONFIG: DateConfig = {
  dateFormat: "full",
  timeFormat: "12-hour",
};

// The config held in memory, already checked on load, read with its type.
export function readDateConfig(config: unknown): DateConfig {
  const read = v.safeParse(dateConfigSchema, config);
  return read.success ? read.output : DEFAULT_DATE_CONFIG;
}
