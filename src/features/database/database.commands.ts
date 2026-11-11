// Commands on a database: its columns and its rows.
import {
  selectDatabase,
  type DatabaseBlock,
  type PropertyDefinition,
  type SelectOption,
} from "../../blocks/database/index.ts";
import { DATABASE_TYPE } from "../../blocks/page/index.ts";
import {
  listOf,
  siblingIds,
  type Block,
  type BlockId,
  type Operation,
  type PropertyId,
  type View,
} from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";
import { propertyType } from "./property-registry.ts";
import { numberExistingRows } from "./row-numbering.ts";

export const DEFAULT_VIEW_NAME = "Table";

export function emptyView(
  id: View["id"],
  databaseId: BlockId,
  name: string,
): View {
  return {
    id,
    databaseId,
    name,
    type: "table",
    sorts: [],
    filter: { conjunction: "and", items: [] },
    propertyOrder: [],
    propertyWidths: {},
    hiddenPropertyIds: [],
    calculations: {},
  };
}

// Creates an empty database with one table view, and opens it.
export const createDatabase = defineCommand<{ parentId: BlockId | null }>({
  type: "database.create",
  newIds: { blocks: 1, views: 1 },
  handle(state, command) {
    const id = command.meta.blockIds[0];
    const viewId = command.meta.viewIds[0];
    const { parentId } = command;
    if (id === undefined || viewId === undefined) return {};
    const { now } = command.meta;
    const props = {
      title: [],
      icon: null,
      isFavorite: false,
      isTrashed: false,
      properties: [],
      viewIds: [viewId],
    };
    const record: Block = {
      id,
      type: DATABASE_TYPE,
      parentId,
      childIds: [],
      props,
      createdAt: now,
      updatedAt: now,
    };
    const index = siblingIds(state.workspace, parentId).length;
    return {
      operations: [
        { type: "record.create", kind: "block", record },
        { type: "list.insert", list: listOf(parentId), id, index },
        {
          type: "record.create",
          kind: "view",
          record: emptyView(viewId, id, DEFAULT_VIEW_NAME),
        },
      ],
      ui: { ...state.ui, activePageId: id },
    };
  },
});

function updateProperties(
  database: DatabaseBlock,
  properties: readonly PropertyDefinition[],
): Operation[] {
  const props = { ...database.props, properties: [...properties] };
  return [
    { type: "record.update", kind: "block", id: database.id, patch: { props } },
  ];
}

export interface AddPropertyPayload {
  readonly databaseId: BlockId;
  readonly propertyType: string;
  readonly name: string;
}

// A new property takes one id, plus one for each option its type starts
// with, such as a status property's three.
export const addProperty = defineCommand<AddPropertyPayload>({
  type: "property.add",
  newIds: (payload) => ({
    properties:
      1 +
      (propertyType(payload.propertyType).startingSettings?.optionCount ?? 0),
  }),
  handle(state, command) {
    const database = selectDatabase(state, command.databaseId);
    const [id, ...optionIds] = command.meta.propertyIds;
    if (database === undefined || id === undefined) return {};
    const starting = propertyType(command.propertyType).startingSettings;
    const numbered = numberExistingRows(state, database, {
      id,
      name: command.name,
      type: command.propertyType,
      ...starting?.create(optionIds),
    });
    return {
      operations: [
        ...updateProperties(database, [
          ...database.props.properties,
          numbered.property,
        ]),
        ...numbered.operations,
      ],
    };
  },
});

export interface ChangePropertyPayload {
  readonly databaseId: BlockId;
  readonly propertyId: PropertyId;
  readonly name?: string;
  readonly description?: string;
  readonly options?: readonly SelectOption[];
}

// The property with a new description; an empty one removes it.
function described(
  property: PropertyDefinition,
  description: string,
): PropertyDefinition {
  const { description: _old, ...rest } = property;
  const text = description.trim().normalize("NFC");
  return text === "" ? rest : { ...rest, description: text };
}

// Renames or describes a property, or replaces the choices of a select
// property.
export const changeProperty = defineCommand<ChangePropertyPayload>({
  type: "property.change",
  handle(state, command) {
    const database = selectDatabase(state, command.databaseId);
    if (database === undefined) return {};
    const properties = database.props.properties.map((property) => {
      if (property.id !== command.propertyId) return property;
      const changed = {
        ...property,
        ...(command.name !== undefined && { name: command.name }),
        ...(command.options !== undefined && { options: [...command.options] }),
      };
      const { description } = command;
      return description === undefined
        ? changed
        : described(changed, description);
    });
    return { operations: updateProperties(database, properties) };
  },
});

// Removes a column. Cell values stay in the rows, unseen, so that undo and
// a later format can bring them back.
export const removeProperty = defineCommand<{
  databaseId: BlockId;
  propertyId: PropertyId;
}>({
  type: "property.remove",
  handle(state, command) {
    const database = selectDatabase(state, command.databaseId);
    if (database === undefined) return {};
    const properties = database.props.properties.filter(
      (property) => property.id !== command.propertyId,
    );
    if (properties.length === database.props.properties.length) return {};
    return { operations: updateProperties(database, properties) };
  },
});

// Replaces a property's config, such as a number's format. The settings
// panel builds the config in the shape the property's type declares.
export const setPropertyConfig = defineCommand<{
  databaseId: BlockId;
  propertyId: PropertyId;
  config: unknown;
}>({
  type: "property.setConfig",
  handle(state, command) {
    const database = selectDatabase(state, command.databaseId);
    if (database === undefined) return {};
    const properties = database.props.properties.map((property) =>
      property.id === command.propertyId
        ? { ...property, config: command.config }
        : property,
    );
    return { operations: updateProperties(database, properties) };
  },
});

export const databaseCommands = [
  createDatabase,
  addProperty,
  changeProperty,
  setPropertyConfig,
  removeProperty,
];
