// Importing a CSV file as a new database, opened once made: one property
// per column after the first, one row per line, each value read as its
// property's type reads text.
import type {
  PropertyDefinition,
  SelectOption,
} from "../../blocks/database/index.ts";
import { DATABASE_TYPE, PAGE_TYPE } from "../../blocks/page/index.ts";
import {
  listOf,
  siblingIds,
  type Block,
  type BlockId,
  type Operation,
  type PropertyId,
} from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";
import type { CsvImportPlan } from "./csv-import.ts";
import { DEFAULT_VIEW_NAME, emptyView } from "./database.commands.ts";
import { convertedValue, optionsNamed } from "./property-convert.ts";

function optionCount(plan: CsvImportPlan): number {
  return plan.columns.reduce((sum, c) => sum + c.optionNames.length, 0);
}

// The columns as properties: their ids first, then their options' ids.
function planProperties(
  plan: CsvImportPlan,
  ids: readonly PropertyId[],
): PropertyDefinition[] {
  const starts = plan.columns.map((_, index) =>
    plan.columns
      .slice(0, index)
      .reduce((sum, c) => sum + c.optionNames.length, plan.columns.length),
  );
  return plan.columns.flatMap((column, index) => {
    const id = ids[index];
    if (id === undefined) return [];
    const start = starts[index] ?? 0;
    const optionIds = ids.slice(start, start + column.optionNames.length);
    const options: SelectOption[] = optionsNamed(column.optionNames, optionIds);
    const { name, type } = column;
    return [{ id, name, type, ...(options.length > 0 && { options }) }];
  });
}

interface RowPlan {
  readonly id: BlockId;
  readonly parentId: BlockId;
  readonly cells: readonly string[];
  readonly now: string;
}

// A cell's text as its property holds it; a cell is read as text first.
function valueOf(property: PropertyDefinition, text: string): unknown {
  const asText = { id: property.id, name: property.name, type: "text" };
  return convertedValue(asText, property, text);
}

function rowRecord(
  row: RowPlan,
  properties: readonly PropertyDefinition[],
): Block {
  const [title = "", ...texts] = row.cells;
  const values = Object.fromEntries(
    properties.flatMap((property, index) => {
      const value = valueOf(property, texts[index] ?? "");
      return value === undefined ? [] : [[property.id, value]];
    }),
  );
  const props = {
    title: title === "" ? [] : [{ text: title }],
    icon: null,
    isFavorite: false,
    isTrashed: false,
    values,
  };
  const { id, parentId, now } = row;
  return {
    ...{ id, type: PAGE_TYPE, parentId, childIds: [], props },
    ...{ createdAt: now, updatedAt: now },
  };
}

function databaseProps(
  title: string,
  properties: readonly PropertyDefinition[],
  viewIds: readonly string[],
) {
  const trimmed = title.trim();
  return {
    title: trimmed === "" ? [] : [{ text: trimmed }],
    icon: null,
    isFavorite: false,
    isTrashed: false,
    properties: [...properties],
    viewIds: [...viewIds],
    templateIds: [],
    defaultTemplateId: null,
  };
}

export const importCsv = defineCommand<{
  parentId: BlockId | null;
  title: string;
  plan: CsvImportPlan;
}>({
  type: "database.importCsv",
  newIds: (payload) => ({
    blocks: 1 + payload.plan.rows.length,
    views: 1,
    properties: payload.plan.columns.length + optionCount(payload.plan),
  }),
  handle(state, command) {
    const { blockIds, viewIds, propertyIds, now } = command.meta;
    const [id, ...rowIds] = blockIds;
    const [viewId] = viewIds;
    if (id === undefined || viewId === undefined) return {};
    const { parentId, plan } = command;
    const properties = planProperties(plan, propertyIds);
    const rows = plan.rows.flatMap((cells, index) => {
      const rowId = rowIds[index];
      if (rowId === undefined) return [];
      return [rowRecord({ id: rowId, parentId: id, cells, now }, properties)];
    });
    const props = databaseProps(command.title, properties, [viewId]);
    const childIds = rows.map((row) => row.id);
    const database: Block = {
      ...{ id, type: DATABASE_TYPE, parentId, childIds, props },
      ...{ createdAt: now, updatedAt: now },
    };
    const index = siblingIds(state.workspace, parentId).length;
    const view = emptyView(viewId, id, DEFAULT_VIEW_NAME);
    const operations: Operation[] = [
      { type: "record.create", kind: "block", record: database },
      ...rows.map((record): Operation => ({
        type: "record.create",
        kind: "block",
        record,
      })),
      { type: "list.insert", list: listOf(parentId), id, index },
      { type: "record.create", kind: "view", record: view },
    ];
    return {
      operations,
      ui: { ...state.ui, activePageId: id, activeCell: null, peek: null },
    };
  },
});

export const csvImportCommands = [importCsv];
