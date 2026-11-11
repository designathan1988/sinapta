// Linked views: a view of a database placed in another page, with views
// of its own. It is made empty from the slash menu, then shown a
// database, which gives it its first view.
import { selectDatabase } from "../../blocks/database/index.ts";
import { LINKED_VIEW_TYPE } from "../../blocks/linked-view/index.ts";
import { listOf, type Block, type BlockId } from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";
import { DEFAULT_VIEW_NAME, emptyView } from "./database.commands.ts";
import { placeFor } from "./inline-database.commands.ts";
import { selectLinkedProps } from "./view-holder.selectors.ts";

export const createLinkedView = defineCommand<{ blockId: BlockId }>({
  type: "linkedView.create",
  newIds: { blocks: 1 },
  handle(state, command) {
    const place = placeFor(state, command.blockId);
    const id = command.meta.blockIds[0];
    if (place === undefined || id === undefined) return {};
    const { now } = command.meta;
    const record: Block = {
      id,
      type: LINKED_VIEW_TYPE,
      parentId: place.parentId,
      childIds: [],
      props: { viewIds: [] },
      createdAt: now,
      updatedAt: now,
    };
    const list = listOf(place.parentId);
    return {
      operations: [
        ...place.removal,
        { type: "record.create", kind: "block", record },
        { type: "list.insert", list, id, index: place.index },
      ],
      ui: { ...state.ui, selection: null },
    };
  },
});

// Shows the linked view a database, through a first table view of its
// own; views it had of another database are left as they are.
export const setLinkedViewSource = defineCommand<{
  blockId: BlockId;
  databaseId: BlockId;
}>({
  type: "linkedView.setSource",
  newIds: { views: 1 },
  handle(state, command) {
    const props = selectLinkedProps(state, command.blockId);
    const database = selectDatabase(state, command.databaseId);
    const viewId = command.meta.viewIds[0];
    if (props === undefined || database === undefined || viewId === undefined) {
      return {};
    }
    const view = emptyView(viewId, database.id, DEFAULT_VIEW_NAME);
    const patch = {
      props: { ...props, databaseId: database.id, viewIds: [viewId] },
    };
    return {
      operations: [
        { type: "record.create", kind: "view", record: view },
        { type: "record.update", kind: "block", id: command.blockId, patch },
      ],
    };
  },
});

export const linkedViewCommands = [createLinkedView, setLinkedViewSource];
