// Version 28 lets a view be locked. A version 27 view was not.
import type { Migration } from "./run-migrations.ts";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const addViewLock: Migration = (file) => {
  const { views } = file;
  if (!isRecord(views)) return file;
  const migrated = Object.fromEntries(
    Object.entries(views).map(([id, view]) => [
      id,
      isRecord(view) ? { ...view, isLocked: false } : view,
    ]),
  );
  return { ...file, views: migrated };
};
