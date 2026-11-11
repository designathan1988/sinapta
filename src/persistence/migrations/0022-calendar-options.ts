// Version 22 lets a calendar show a week, hide its weekends and start its
// weeks on Monday. A version 21 calendar showed whole months, weekends
// included, from Sunday.
import type { Migration } from "./run-migrations.ts";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const DEFAULTS = { mode: "month", showWeekends: true, weekStartsOn: 0 };

export const addCalendarOptions: Migration = (file) => {
  const { views } = file;
  if (!isRecord(views)) return file;
  const migrated = Object.fromEntries(
    Object.entries(views).map(([id, view]) => [
      id,
      isRecord(view) ? { ...view, calendar: { ...DEFAULTS } } : view,
    ]),
  );
  return { ...file, views: migrated };
};
