// Row templates, as Notion's: pages kept in the database and out of its
// views, that a new row starts from; which one by default is in
// template-default.commands.ts.
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
  type ViewId,
} from "../../model/index.ts";
import {
  defineCommand,
  type AppState,
  type UiState,
} from "../../state/index.ts";
import type { RowTemplate } from "./row.commands.ts";
import { openingTemplate } from "./template-open.ts";

interface TemplatesChange {
  readonly templateIds?: readonly BlockId[];
  readonly defaultTemplateId?: BlockId | null;
}

export function templatesUpdate(
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

// Adds an empty template at the end and opens it, to be written.
export const addTemplate = defineCommand<{
  databaseId: BlockId;
  viewId?: ViewId;
}>({
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
      ui: openingTemplate(state, id, command.viewId),
    };
  },
});

// A template's Edit, from the templates menu.
export const editTemplate = defineCommand<{
  templateId: BlockId;
  viewId: ViewId;
}>({
  type: "template.edit",
  handle(state, { templateId, viewId }) {
    if (selectTemplateDatabase(state, templateId) === undefined) return {};
    return { ui: openingTemplate(state, templateId, viewId) };
  },
});

// Where a deleted template open on screen leaves the person: its peek
// closes; open as a page, its database opens.
function closingTemplate(
  state: AppState,
  templateId: BlockId,
  databaseId: BlockId,
): UiState | undefined {
  const isPage = state.ui.activePageId === templateId;
  const isPeek = state.ui.peek?.pageId === templateId;
  if (!isPage && !isPeek) return undefined;
  return {
    ...state.ui,
    ...(isPage && { activePageId: databaseId }),
    ...(isPeek && { peek: null }),
  };
}

function treeIds(state: AppState, id: BlockId): BlockId[] {
  const block = state.workspace.blocks[id];
  if (block === undefined) return [];
  return [id, ...block.childIds.flatMap((childId) => treeIds(state, childId))];
}

// A view's own default template; null is an empty page.
export function viewDefaultUpdate(
  viewId: ViewId,
  templateId: BlockId | null,
): Operation {
  const patch = { defaultTemplateId: templateId };
  return { type: "record.update", kind: "view", id: viewId, patch };
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
    const ui = closingTemplate(state, templateId, database.id);
    return {
      operations: [
        templatesUpdate(database, change),
        ...database.props.viewIds
          .filter(
            (id) => state.workspace.views[id]?.defaultTemplateId === templateId,
          )
          .map((id) => viewDefaultUpdate(id, null)),
        { type: "list.remove", list, id: templateId },
        ...treeIds(state, templateId).map((id): Operation => ({
          type: "record.delete",
          kind: "block",
          id,
        })),
      ],
      ...(ui !== undefined && { ui }),
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
  editTemplate,
  deleteTemplate,
  duplicateTemplate,
];
