// A database's data sources, as Notion's Manage data sources: other
// databases linked to it (Link existing data source), or a new one made
// beside it and linked (Add data source); each of its views shows its own
// database or one of these. Unlinking a source puts its views back on the
// database's own rows.
import {
  selectDatabase,
  type DatabaseBlock,
} from "../../blocks/database/index.ts";
import { DATABASE_TYPE } from "../../blocks/page/index.ts";
import {
  listOf,
  siblingIds,
  type Block,
  type BlockId,
  type Operation,
  type ViewId,
} from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { DEFAULT_VIEW_NAME, emptyView } from "./database.commands.ts";

function withSources(
  database: DatabaseBlock,
  sourceIds: readonly BlockId[],
  now: string,
): Operation {
  const props = { ...database.props, sourceIds: [...sourceIds] };
  return {
    type: "record.update",
    kind: "block",
    id: database.id,
    patch: { props, updatedAt: now },
  };
}

export const linkDataSource = defineCommand<{
  databaseId: BlockId;
  sourceId: BlockId;
}>({
  type: "database.linkSource",
  handle(state, command) {
    const database = selectDatabase(state, command.databaseId);
    const source = selectDatabase(state, command.sourceId);
    if (database === undefined || source === undefined) return {};
    const linked = database.props.sourceIds ?? [];
    if (source.id === database.id || linked.includes(source.id)) return {};
    const sources = [...linked, source.id];
    return { operations: [withSources(database, sources, command.meta.now)] };
  },
});

// Unlinks a source; the views that showed it show the database again.
export const unlinkDataSource = defineCommand<{
  databaseId: BlockId;
  sourceId: BlockId;
}>({
  type: "database.unlinkSource",
  handle(state, command) {
    const database = selectDatabase(state, command.databaseId);
    if (database === undefined) return {};
    const sources = (database.props.sourceIds ?? []).filter(
      (id) => id !== command.sourceId,
    );
    const views = database.props.viewIds.flatMap((viewId): Operation[] => {
      const view = state.workspace.views[viewId];
      if (view?.sourceId !== command.sourceId) return [];
      return [
        {
          type: "record.update",
          kind: "view",
          id: viewId,
          patch: { sourceId: undefined },
        },
      ];
    });
    const update = withSources(database, sources, command.meta.now);
    return { operations: [update, ...views] };
  },
});

function sourceRecord(
  ids: { readonly id: BlockId; readonly viewId: ViewId },
  parentId: BlockId | null,
  now: string,
): Block {
  const { id, viewId } = ids;
  return {
    id,
    type: DATABASE_TYPE,
    parentId,
    childIds: [],
    props: {
      title: [{ text: COPY.database.newDataSource }],
      icon: null,
      isFavorite: false,
      isTrashed: false,
      properties: [],
      viewIds: [viewId],
      templateIds: [],
      defaultTemplateId: null,
    },
    createdAt: now,
    updatedAt: now,
  };
}

// A new database right after this one, titled "New data source", linked.
export const addDataSource = defineCommand<{ databaseId: BlockId }>({
  type: "database.addSource",
  newIds: { blocks: 1, views: 1 },
  handle(state, command) {
    const database = selectDatabase(state, command.databaseId);
    const id = command.meta.blockIds[0];
    const viewId = command.meta.viewIds[0];
    if (database === undefined || id === undefined || viewId === undefined)
      return {};
    const { now } = command.meta;
    const record = sourceRecord({ id, viewId }, database.parentId, now);
    const siblings = siblingIds(state.workspace, database.parentId);
    const index = siblings.indexOf(database.id) + 1;
    const sources = [...(database.props.sourceIds ?? []), id];
    return {
      operations: [
        { type: "record.create", kind: "block", record },
        { type: "list.insert", list: listOf(database.parentId), id, index },
        {
          type: "record.create",
          kind: "view",
          record: emptyView(viewId, id, DEFAULT_VIEW_NAME),
        },
        withSources(database, sources, now),
      ],
    };
  },
});

// The source a view shows: one of its database's sources, or (null) its
// own database.
export const setViewSource = defineCommand<{
  viewId: ViewId;
  sourceId: BlockId | null;
}>({
  type: "view.setSource",
  handle(state, command) {
    const view = state.workspace.views[command.viewId];
    if (view === undefined) return {};
    const patch = {
      sourceId: command.sourceId ?? undefined,
    };
    return {
      operations: [{ type: "record.update", kind: "view", id: view.id, patch }],
    };
  },
});

export const dataSourceCommands = [
  linkDataSource,
  unlinkDataSource,
  addDataSource,
  setViewSource,
];
