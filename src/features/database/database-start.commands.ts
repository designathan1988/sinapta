// An empty page can become a database, as a page in Notion does when one
// of its "Get started with" layouts is chosen. A board starts with a
// status property to group by, a calendar with a date to place rows by.
import {
  DATABASE_TYPE,
  PAGE_TYPE,
  selectPage,
} from "../../blocks/page/index.ts";
import type { BlockId, PropertyId, View, ViewType } from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { emptyView } from "./database.commands.ts";
import { groupByProperty } from "./group.commands.ts";

const TEXT = COPY.database;

interface StartPayload {
  readonly pageId: BlockId;
  readonly viewType: ViewType;
}

// A board needs a status property and its three options; a calendar a date.
function propertyIdCount(viewType: ViewType): number {
  if (viewType === "board") return 4;
  return viewType === "calendar" || viewType === "timeline" ? 1 : 0;
}

function startingProperties(viewType: ViewType, ids: readonly PropertyId[]) {
  const [id, todo = "", doing = "", done = ""] = ids;
  if (id === undefined) return [];
  if (viewType === "calendar" || viewType === "timeline") {
    return [{ id, name: TEXT.dateName, type: "date" }];
  }
  const options = [
    { id: todo, name: TEXT.statusOptions.todo, color: "gray" },
    { id: doing, name: TEXT.statusOptions.doing, color: "blue" },
    { id: done, name: TEXT.statusOptions.done, color: "green" },
  ];
  return [{ id, name: TEXT.statusName, type: "select", options }];
}

function startingView(view: View, viewType: ViewType, id?: PropertyId): View {
  if (viewType === "board" && id !== undefined) {
    return { ...view, type: viewType, groupBy: groupByProperty(id) };
  }
  if (viewType === "calendar" && id !== undefined) {
    return { ...view, type: viewType, datePropertyId: id };
  }
  return { ...view, type: viewType };
}

export const startDatabase = defineCommand<StartPayload>({
  type: "database.startFromPage",
  newIds: (payload) => ({
    views: 1,
    properties: propertyIdCount(payload.viewType),
  }),
  handle(state, command) {
    const page = selectPage(state, command.pageId);
    const [viewId] = command.meta.viewIds;
    if (page?.type !== PAGE_TYPE || viewId === undefined) return {};
    if (page.childIds.length > 0) return {};
    const { viewType } = command;
    const ids = command.meta.propertyIds;
    const { title, icon, isFavorite, isTrashed } = page.props;
    const props = {
      ...{ title, icon, isFavorite, isTrashed },
      properties: startingProperties(viewType, ids),
      viewIds: [viewId],
    };
    const view = startingView(
      emptyView(viewId, page.id, TEXT.layouts[viewType]),
      viewType,
      ids[0],
    );
    return {
      operations: [
        {
          type: "record.update",
          kind: "block",
          id: page.id,
          patch: { type: DATABASE_TYPE, props },
        },
        { type: "record.create", kind: "view", record: view },
      ],
    };
  },
});

export const databaseStartCommands = [startDatabase];
