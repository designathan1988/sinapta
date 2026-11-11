// Version 16 groups a view's filters with and or or, and a group may hold
// one more group. A version 15 view's list of filters, which all had to
// pass, becomes an and group of them under the new key `filter`.
import type { Migration } from "./run-migrations.ts";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function migrateView(view: unknown): unknown {
  if (!isRecord(view)) return view;
  const { filters, ...rest } = view;
  const items = Array.isArray(filters) ? filters : [];
  return { ...rest, filter: { conjunction: "and", items } };
}

export const addFilterGroups: Migration = (file) => {
  const { views } = file;
  if (!isRecord(views)) return file;
  const migrated = Object.fromEntries(
    Object.entries(views).map(([id, view]) => [id, migrateView(view)]),
  );
  return { ...file, views: migrated };
};
