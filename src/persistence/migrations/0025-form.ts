// Version 25 adds the form layout and its options. A version 24 view had
// none: its form requires no answer and has no description.
import type { Migration } from "./run-migrations.ts";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const addForm: Migration = (file) => {
  const { views } = file;
  if (!isRecord(views)) return file;
  const migrated = Object.fromEntries(
    Object.entries(views).map(([id, view]) => [
      id,
      isRecord(view)
        ? { ...view, form: { requiredPropertyIds: [], description: "" } }
        : view,
    ]),
  );
  return { ...file, views: migrated };
};
