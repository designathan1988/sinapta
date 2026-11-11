// Keeps relations whole whichever command deletes a page: a deleted row
// leaves every relation that held it, and a relation whose database is
// deleted becomes a text property that keeps the titles it showed. One
// operation per changed record, so several relations of one database do
// not overwrite each other.
import type {
  DatabaseBlock,
  PropertyDefinition,
} from "../../../../blocks/database/index.ts";
import {
  DATABASE_TYPE,
  isPageLike,
  selectPageTitle,
  type PageBlock,
} from "../../../../blocks/page/index.ts";
import {
  isBlockOfType,
  parseBlockId,
  type BlockId,
  type Operation,
  type Workspace,
} from "../../../../model/index.ts";
import type { Tidier } from "../../../../state/index.ts";
import { readRelation } from "./relation-values.ts";
import { readRelationConfig } from "./relation.schema.ts";

const RELATION = "relation";
const TEXT = "text";

function deletedIds(
  workspace: Workspace,
  changed: ReadonlySet<BlockId>,
  before: Workspace,
): ReadonlySet<string> {
  return new Set(
    [...changed].filter(
      (id) =>
        before.blocks[id] !== undefined && workspace.blocks[id] === undefined,
    ),
  );
}

function titleBefore(before: Workspace, id: string): string | undefined {
  const blockId = parseBlockId(id);
  const block = blockId === undefined ? undefined : before.blocks[blockId];
  return block !== undefined && isPageLike(block)
    ? selectPageTitle(block)
    : undefined;
}

interface Tidying {
  readonly before: Workspace;
  readonly deleted: ReadonlySet<string>;
  // Relations whose database was deleted, by property id.
  readonly toText: ReadonlySet<string>;
}

// A row's relation values once deleted pages are gone, or turned to text.
function valueAfter(value: unknown, propertyId: string, tidying: Tidying) {
  const ids = readRelation(value) ?? [];
  if (tidying.toText.has(propertyId)) {
    const titles = ids.flatMap((id) => titleBefore(tidying.before, id) ?? []);
    return titles.length === 0 ? undefined : titles.join(", ");
  }
  const kept = ids.filter((id) => !tidying.deleted.has(id));
  return kept.length === 0 ? undefined : kept;
}

function rowOperation(
  row: PageBlock,
  relations: readonly PropertyDefinition[],
  tidying: Tidying,
): Operation[] {
  const old = row.props.values ?? {};
  const isRelation = new Set<string>(relations.map((property) => property.id));
  const entries = Object.entries(old).flatMap(([id, value]) => {
    if (!isRelation.has(id)) return [[id, value] as const];
    const next = valueAfter(value, id, tidying);
    return next === undefined ? [] : [[id, next] as const];
  });
  const values = Object.fromEntries(entries);
  if (JSON.stringify(values) === JSON.stringify(old)) return [];
  const props = { ...row.props, values };
  return [
    { type: "record.update", kind: "block", id: row.id, patch: { props } },
  ];
}

function asText(property: PropertyDefinition): PropertyDefinition {
  const { id, name, description } = property;
  return {
    id,
    name,
    type: TEXT,
    ...(description !== undefined && { description }),
  };
}

function tidyDatabase(
  workspace: Workspace,
  database: DatabaseBlock,
  base: Omit<Tidying, "toText">,
): Operation[] {
  const relations = database.props.properties.filter(
    (property) => property.type === RELATION,
  );
  if (relations.length === 0) return [];
  const toText = new Set(
    relations.flatMap((property) => {
      const target = readRelationConfig(property.config)?.databaseId;
      return target !== undefined && base.deleted.has(target)
        ? [property.id]
        : [];
    }),
  );
  const tidying = { ...base, toText };
  const rows = database.childIds.flatMap((id) => {
    const row = workspace.blocks[id];
    return row !== undefined && isPageLike(row) ? [row] : [];
  });
  const rowOperations = rows.flatMap((row) =>
    rowOperation(row, relations, tidying),
  );
  if (toText.size === 0) return rowOperations;
  const properties = database.props.properties.map((property) =>
    toText.has(property.id) ? asText(property) : property,
  );
  const props = { ...database.props, properties };
  return [
    { type: "record.update", kind: "block", id: database.id, patch: { props } },
    ...rowOperations,
  ];
}

export const relationTidier: Tidier = (workspace, changed, before) => {
  const deleted = deletedIds(workspace, changed, before);
  if (deleted.size === 0) return [];
  return Object.values(workspace.blocks).flatMap((block) =>
    isBlockOfType<DatabaseBlock>(block, DATABASE_TYPE)
      ? tidyDatabase(workspace, block, { before, deleted })
      : [],
  );
};
