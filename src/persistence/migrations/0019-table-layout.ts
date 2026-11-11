// Version 19 lets a table view wrap the text of chosen columns and keep
// its first columns in place while it scrolls sideways. A version 18 view
// wrapped none and froze none.
import type { Migration } from "./run-migrations.ts";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function migrateView(view: unknown): unknown {
  if (!isRecord(view)) return view;
  return { ...view, wrappedPropertyIds: [], frozenCount: 0 };
}

export const addTableLayout: Migration = (file) => {
  const { views } = file;
  if (!isRecord(views)) return file;
  const migrated = Object.fromEntries(
    Object.entries(views).map(([id, view]) => [id, migrateView(view)]),
  );
  return { ...file, views: migrated };
};
