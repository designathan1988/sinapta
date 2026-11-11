// Row templates, as Notion's: pages kept in the database and out of its
// views, that a new row starts from. One may be the default, which every
// new row starts from.
import {
  selectDatabase,
  type DatabaseBlock,
} from "../../blocks/database/index.ts";
import {
  PAGE_TYPE,
  selectPage,
  selectPageCopySize,
} from "../../blocks/page/index.ts";
import {
  copyBlockTree,
  listOf,
  type Block,
  type BlockId,
  type Operation,
} from "../../model/index.ts";
import { defineCommand, type AppState } from "../../state/index.ts";
import type { AddRowPayload, RowTemplate } from "./row.commands.ts";

interface TemplatesChange {
  readonly templateIds?: readonly BlockId[];
  readonly defaultTemplateId?: BlockId | null;
}

function templatesUpdate(
  database: DatabaseBlock,
  change: TemplatesChange,
): Operation {
  const { templateIds = database.props.templateIds } = change;
  const { defaultTemplateId = database.props.defaultTemplateId } = change;
  const props = {
    ...database.props,
    templateIds: [...templateIds],
    defaultTemplateId,
  };
  return {
    type: "record.update",
    kind: "block",
    id: database.id,
    patch: { props },
  };
}

// The database the page is a template of, if it is one.
export function selectTemplateDatabase(
  state: AppState,
  pageId: BlockId,
): DatabaseBlock | undefined {
  const page = selectPage(state, pageId);
  const database = selectDatabase(state, page?.parentId ?? null);
  return database?.props.templateIds.includes(pageId) === true
    ? database
    : undefined;
}

// What a row made from the template needs; none for a template holding a
// database, whose views a copy could not share.
export function selectRowTemplate(
  state: AppState,
  templateId: BlockId,
): RowTemplate | undefined {
  if (selectTemplateDatabase(state, templateId) === undefined) return undefined;
  const size = selectPageCopySize(state, templateId);
  if (size.viewCount > 0) return undefined;
  return { id: templateId, blockCount: size.blockCount };
}

// A new row's payload with the database's default template, unless it
// names its own.
export function withDefaultTemplate(
  state: AppState,
  payload: AddRowPayload,
): AddRowPayload {
  if (payload.template !== undefined) return payload;
  const database = selectDatabase(state, payload.databaseId);
  const templateId = database?.props.defaultTemplateId ?? null;
  const template =
    templateId === null ? undefined : selectRowTemplate(state, templateId);
  return template === undefined ? payload : { ...payload, template };
}

// Adds an empty template at the end and opens it, to be written.
export const addTemplate = defineCommand<{ databaseId: BlockId }>({
  type: "template.add",
  newBlockIds: 1,
  handle(state, command) {
    const database = selectDatabase(state, command.databaseId);
    const id = command.meta.blockIds[0];
    if (database === undefined || id === undefined) return {};
    const { now } = command.meta;
    const props = {
      title: [],
      icon: null,
      isFavorite: false,
      isTrashed: false,
      values: {},
    };
    const record: Block = {
      id,
      type: PAGE_TYPE,
      parentId: database.id,
      childIds: [],
      props,
      createdAt: now,
      updatedAt: now,
    };
    const index = database.childIds.length;
    const templateIds = [...database.props.templateIds, id];
    return {
      operations: [
        { type: "record.create", kind: "block", record },
        { type: "list.insert", list: listOf(database.id), id, index },
        templatesUpdate(database, { templateIds }),
      ],
      ui: { ...state.ui, activePageId: id, activeCell: null, peek: null },
    };
  },
});

export const setDefaultTemplate = defineCommand<{
  databaseId: BlockId;
  // None: new rows start empty.
  templateId: BlockId | null;
}>({
  type: "template.setDefault",
  handle(state, command) {
    const database = selectDatabase(state, command.databaseId);
    const { templateId } = command;
    if (database === undefined) return {};
    if (templateId !== null && !database.props.templateIds.includes(templateId))
      return {};
    return {
      operations: [
        templatesUpdate(database, { defaultTemplateId: templateId }),
      ],
    };
  },
});

function treeIds(state: AppState, id: BlockId): BlockId[] {
  const block = state.workspace.blocks[id];
  if (block === undefined) return [];
  return [id, ...block.childIds.flatMap((childId) => treeIds(state, childId))];
}

// Deletes a template and its blocks for good, as Notion's templates are.
export const deleteTemplate = defineCommand<{ templateId: BlockId }>({
  type: "template.delete",
  handle(state, command) {
    const { templateId } = command;
    const database = selectTemplateDatabase(state, templateId);
    if (database === undefined) return {};
    const { templateIds, defaultTemplateId } = database.props;
    const change = {
      templateIds: templateIds.filter((id) => id !== templateId),
      defaultTemplateId:
        defaultTemplateId === templateId ? null : defaultTemplateId,
    };
    const list = listOf(database.id);
    const isOpen = state.ui.activePageId === templateId;
    return {
      operations: [
        templatesUpdate(database, change),
        { type: "list.remove", list, id: templateId },
        ...treeIds(state, templateId).map((id): Operation => ({
          type: "record.delete",
          kind: "block",
          id,
        })),
      ],
      ...(isOpen && { ui: { ...state.ui, activePageId: database.id } }),
    };
  },
});

// Copies a template, with its blocks, right after it.
export const duplicateTemplate = defineCommand<{
  templateId: BlockId;
  blockCount: number;
}>({
  type: "template.duplicate",
  newIds: (payload) => ({ blocks: payload.blockCount }),
  handle(state, command) {
    const { templateId } = command;
    const database = selectTemplateDatabase(state, templateId);
    const { blockIds, now } = command.meta;
    const copies = copyBlockTree(state.workspace, {
      rootId: templateId,
      ids: blockIds,
      now,
    });
    const root = copies?.[0];
    if (database === undefined || copies === undefined || root === undefined)
      return {};
    if (copies.length !== command.blockCount) return {};
    const { templateIds } = database.props;
    const at = templateIds.indexOf(templateId) + 1;
    const index = database.childIds.indexOf(templateId) + 1;
    const list = listOf(database.id);
    return {
      operations: [
        ...copies.map((record): Operation => ({
          type: "record.create",
          kind: "block",
          record,
        })),
        { type: "list.insert", list, id: root.id, index },
        templatesUpdate(database, {
          templateIds: [
            ...templateIds.slice(0, at),
            root.id,
            ...templateIds.slice(at),
          ],
        }),
      ],
    };
  },
});

export const templateCommands = [
  addTemplate,
  setDefaultTemplate,
  deleteTemplate,
  duplicateTemplate,
];
