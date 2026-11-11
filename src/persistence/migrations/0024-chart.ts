// Version 24 adds the chart layout and its options. A version 23 view had
// none: its chart counts rows in columns.
import type { Migration } from "./run-migrations.ts";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const addChart: Migration = (file) => {
  const { views } = file;
  if (!isRecord(views)) return file;
  const migrated = Object.fromEntries(
    Object.entries(views).map(([id, view]) => [
      id,
      isRecord(view)
        ? { ...view, chart: { kind: "column", aggregate: "count" } }
        : view,
    ]),
  );
  return { ...file, views: migrated };
};
