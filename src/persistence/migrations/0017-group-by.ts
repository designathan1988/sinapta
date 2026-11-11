// Version 17 lets every layout group its rows. A version 16 board's group
// property becomes its grouping under the new key `groupBy`; the other
// layouts did not group, so the property they kept from a board goes.
import type { Migration } from "./run-migrations.ts";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function migrateView(view: unknown): unknown {
  if (!isRecord(view)) return view;
  const { groupPropertyId, ...rest } = view;
  if (view.type !== "board" || typeof groupPropertyId !== "string") {
    return rest;
  }
  const groupBy = {
    propertyId: groupPropertyId,
    sort: "manual",
    hideEmpty: false,
    collapsed: [],
    dateBy: "month",
  };
  return { ...rest, groupBy };
}

export const addGroupBy: Migration = (file) => {
  const { views } = file;
  if (!isRecord(views)) return file;
  const migrated = Object.fromEntries(
    Object.entries(views).map(([id, view]) => [id, migrateView(view)]),
  );
  return { ...file, views: migrated };
};
