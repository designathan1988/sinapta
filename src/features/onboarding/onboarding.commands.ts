// The pages a first visit starts with. Run once, on an empty workspace,
// and saved like any other change.
import {
  applyOperations,
  listOf,
  type Block,
  type BlockId,
  type Operation,
} from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";
import {
  countSeedBlocks,
  GETTING_STARTED,
  type SeedBlock,
} from "./getting-started-page.ts";
import {
  TASK_PROPERTIES,
  TASK_ROWS,
  TASK_VIEWS,
  taskBlocks,
  taskViews,
} from "./tasks-database.ts";

const PAGE_BLOCKS = countSeedBlocks(GETTING_STARTED);

interface Placing {
  readonly ids: readonly BlockId[];
  readonly now: string;
  next: number;
}

// The records of a seed tree, each before its children, with ids taken in
// order.
function place(
  seed: SeedBlock,
  parentId: BlockId | null,
  placing: Placing,
): Block[] {
  const id = placing.ids[placing.next];
  placing.next += 1;
  if (id === undefined) return [];
  const children = (seed.children ?? []).map((child) =>
    place(child, id, placing),
  );
  const record: Block = {
    id,
    type: seed.type,
    parentId,
    childIds: children.flatMap((list) => list[0]?.id ?? []),
    props: seed.props,
    createdAt: placing.now,
    updatedAt: placing.now,
  };
  return [record, ...children.flat()];
}

function createAll(blocks: readonly Block[]): Operation[] {
  return blocks.map((record) => ({
    type: "record.create",
    kind: "block",
    record,
  }));
}

export const seedGettingStarted = defineCommand<Record<string, never>>({
  type: "workspace.seedGettingStarted",
  newIds: {
    blocks: PAGE_BLOCKS + 1 + TASK_ROWS,
    views: TASK_VIEWS,
    properties: TASK_PROPERTIES,
  },
  handle(state, command) {
    if (state.workspace.rootIds.length > 0) return {};
    const { blockIds, viewIds, propertyIds, now } = command.meta;
    const placing = { ids: blockIds.slice(0, PAGE_BLOCKS), now, next: 0 };
    const page = place(GETTING_STARTED, null, placing);
    const [databaseId, ...rowIds] = blockIds.slice(PAGE_BLOCKS);
    const root = page[0];
    if (root === undefined || databaseId === undefined) return {};
    const taskIds = { databaseId, rowIds, viewIds, propertyIds };
    const views = taskViews(taskIds).map((record): Operation => ({
      type: "record.create",
      kind: "view",
      record,
    }));
    const operations: Operation[] = [
      ...createAll([...page, ...taskBlocks(taskIds, now)]),
      ...views,
      { type: "list.insert", list: listOf(null), id: root.id, index: 0 },
      { type: "list.insert", list: listOf(null), id: databaseId, index: 1 },
    ];
    // Starting content, like loaded data, is not a change to undo.
    const result = applyOperations(state.workspace, operations);
    if (!result.ok) return {};
    const ui = { ...state.ui, activePageId: root.id };
    return { workspace: result.workspace, ui };
  },
});

export const onboardingCommands = [seedGettingStarted];
