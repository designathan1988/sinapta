// Version 23 adds the timeline layout and its options. A version 22 view
// had none: its timeline shows months, with the table of rows beside it.
import type { Migration } from "./run-migrations.ts";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const addTimeline: Migration = (file) => {
  const { views } = file;
  if (!isRecord(views)) return file;
  const migrated = Object.fromEntries(
    Object.entries(views).map(([id, view]) => [
      id,
      isRecord(view)
        ? { ...view, timeline: { zoom: "month", showTable: true } }
        : view,
    ]),
  );
  return { ...file, views: migrated };
};
