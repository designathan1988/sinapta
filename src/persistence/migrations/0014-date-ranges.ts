// Version 14 lets a date property hold a range and a time: its value
// becomes { start, end?, time? }. A version 13 value, a "YYYY-MM-DD"
// string in a row of a database whose property of that id is a date,
// becomes { start }. Anything else is left for the schema to judge.
import type { Migration } from "./run-migrations.ts";

type JsonRecord = Record<string, unknown>;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function propsOf(block: unknown): JsonRecord | undefined {
  return isRecord(block) && isRecord(block.props) ? block.props : undefined;
}

// Database id to the ids of its date properties.
function datePropertiesByDatabase(
  blocks: JsonRecord,
): Map<string, Set<string>> {
  const found = new Map<string, Set<string>>();
  for (const [id, block] of Object.entries(blocks)) {
    const properties = propsOf(block)?.properties;
    if (!isRecord(block) || block.type !== "database") continue;
    if (!Array.isArray(properties)) continue;
    const dates = properties.flatMap((property: unknown) =>
      isRecord(property) &&
      property.type === "date" &&
      typeof property.id === "string"
        ? [property.id]
        : [],
    );
    found.set(id, new Set(dates));
  }
  return found;
}

function migrateRow(block: unknown, dates: ReadonlySet<string>): unknown {
  const props = propsOf(block);
  const values = props?.values;
  if (!isRecord(block) || props === undefined || !isRecord(values))
    return block;
  const migrated = Object.fromEntries(
    Object.entries(values).map(([id, value]) =>
      dates.has(id) && typeof value === "string" && ISO_DATE.test(value)
        ? [id, { start: value }]
        : [id, value],
    ),
  );
  return { ...block, props: { ...props, values: migrated } };
}

export const addDateRanges: Migration = (file) => {
  const { blocks } = file;
  if (!isRecord(blocks)) return file;
  const byDatabase = datePropertiesByDatabase(blocks);
  const migrated = Object.fromEntries(
    Object.entries(blocks).map(([id, block]) => {
      const parentId = isRecord(block) ? block.parentId : undefined;
      const dates =
        typeof parentId === "string" ? byDatabase.get(parentId) : undefined;
      return [id, dates === undefined ? block : migrateRow(block, dates)];
    }),
  );
  return { ...file, blocks: migrated };
};
