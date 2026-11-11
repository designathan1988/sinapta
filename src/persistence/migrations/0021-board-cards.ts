// Version 21 lets a view order and hide its groups, and size its cards,
// choose their picture and tint a board's columns. A version 20 view's
// groups were in their property's order and all shown; its cards were
// medium, a gallery's showing the first image on the row's page, and a
// board's columns were tinted.
import type { Migration } from "./run-migrations.ts";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function migrateView(view: unknown): unknown {
  if (!isRecord(view)) return view;
  const { groupBy } = view;
  return {
    ...view,
    ...(isRecord(groupBy) && {
      groupBy: { ...groupBy, order: [], hidden: [] },
    }),
    cardSize: "medium",
    cardPreview: view.type === "gallery" ? "content" : "cover",
    colorColumns: true,
  };
}

export const addBoardCards: Migration = (file) => {
  const { views } = file;
  if (!isRecord(views)) return file;
  const migrated = Object.fromEntries(
    Object.entries(views).map(([id, view]) => [id, migrateView(view)]),
  );
  return { ...file, views: migrated };
};
