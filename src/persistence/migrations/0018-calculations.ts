// Version 18 lets a view work out a calculation under each column, kept
// in the view under the new key `calculations`. A version 17 view had
// none.
import type { Migration } from "./run-migrations.ts";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function migrateView(view: unknown): unknown {
  return isRecord(view) ? { ...view, calculations: {} } : view;
}

export const addCalculations: Migration = (file) => {
  const { views } = file;
  if (!isRecord(views)) return file;
  const migrated = Object.fromEntries(
    Object.entries(views).map(([id, view]) => [id, migrateView(view)]),
  );
  return { ...file, views: migrated };
};
