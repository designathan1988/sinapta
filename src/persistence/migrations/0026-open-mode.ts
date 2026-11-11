// Version 26 lets a view open its rows in a side or center peek. A
// version 25 view opened them as their own pages; Notion opens them in a
// side peek, and so do views from now on.
import type { Migration } from "./run-migrations.ts";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const addOpenMode: Migration = (file) => {
  const { views } = file;
  if (!isRecord(views)) return file;
  const migrated = Object.fromEntries(
    Object.entries(views).map(([id, view]) => [
      id,
      isRecord(view) ? { ...view, openMode: "side" } : view,
    ]),
  );
  return { ...file, views: migrated };
};
