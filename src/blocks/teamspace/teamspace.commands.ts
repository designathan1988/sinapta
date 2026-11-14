// Making a teamspace, as Notion's "Create teamspace": at the workspace's
// top, open in the sidebar.
import type { Operation } from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";
import { TEAMSPACE_TYPE } from "./teamspace.schema.ts";

export const createTeamspace = defineCommand<{
  name: string;
  description: string;
}>({
  type: "teamspace.create",
  newBlockIds: 1,
  handle(state, command) {
    const id = command.meta.blockIds[0];
    const name = command.name.trim();
    if (id === undefined || name === "") return {};
    const { now } = command.meta;
    const props = {
      name,
      icon: null,
      description: command.description.trim(),
    };
    const record = {
      id,
      type: TEAMSPACE_TYPE,
      parentId: null,
      childIds: [],
      props,
      createdAt: now,
      updatedAt: now,
    };
    const operations: Operation[] = [
      { type: "record.create", kind: "block", record },
      {
        type: "list.insert",
        list: { kind: "rootIds" },
        id,
        index: state.workspace.rootIds.length,
      },
    ];
    const expandedPageIds = [...state.ui.expandedPageIds, id];
    return { operations, ui: { ...state.ui, expandedPageIds } };
  },
});
