import {
  dropMove,
  planMove,
  siblingIds,
  type BlockId,
  type BlockMove,
  type Drop,
} from "../../model/index.ts";
import { defineCommand, type AppState } from "../../state/index.ts";
import type { PageBlock } from "./page.schema.ts";
import { selectPage } from "./page.selectors.ts";

export interface MovePagePayload {
  readonly pageId: BlockId;
  readonly parentId: BlockId | null;
  // Position among the new siblings, counted without the moved page.
  readonly index: number;
}

function toPayload(move: BlockMove): MovePagePayload {
  return { pageId: move.blockId, parentId: move.parentId, index: move.index };
}

// Moves a page to a parent and position. A page cannot move into itself,
// and it can only move into another page.
export const movePage = defineCommand<MovePagePayload>({
  type: "page.move",
  handle(state, command) {
    const { pageId, parentId, index } = command;
    if (selectPage(state, pageId) === undefined) return {};
    if (parentId !== null && selectPage(state, parentId) === undefined)
      return {};
    const operations = planMove(state.workspace, {
      blockId: pageId,
      parentId,
      index,
    });
    if (operations.length === 0) return {};
    const expanded = state.ui.expandedPageIds;
    const expandedPageIds =
      parentId === null || expanded.includes(parentId)
        ? expanded
        : [...expanded, parentId];
    return { operations, ui: { ...state.ui, expandedPageIds } };
  },
});

export type MoveDirection = "up" | "down" | "in" | "out";

type Step = (state: AppState, page: PageBlock) => MovePagePayload | undefined;

function stepWithin(offset: number): Step {
  return (state, page) => {
    const siblings = siblingIds(state.workspace, page.parentId);
    const index = siblings.indexOf(page.id) + offset;
    if (index < 0 || index >= siblings.length) return undefined;
    return { pageId: page.id, parentId: page.parentId, index };
  };
}

// Becomes the last child of the page above it.
const stepIn: Step = (state, page) => {
  const siblings = siblingIds(state.workspace, page.parentId);
  const above = siblings[siblings.indexOf(page.id) - 1];
  if (above === undefined || selectPage(state, above) === undefined)
    return undefined;
  const index = state.workspace.blocks[above]?.childIds.length ?? 0;
  return { pageId: page.id, parentId: above, index };
};

// Goes right after its parent.
const stepOut: Step = (state, page) => {
  const parent = selectPage(state, page.parentId);
  if (parent === undefined) return undefined;
  const index =
    siblingIds(state.workspace, parent.parentId).indexOf(parent.id) + 1;
  return { pageId: page.id, parentId: parent.parentId, index };
};

const STEPS: Record<MoveDirection, Step> = {
  up: stepWithin(-1),
  down: stepWithin(1),
  in: stepIn,
  out: stepOut,
};

// Where one keyboard step takes a page, or undefined when it cannot go
// further that way.
export function selectStepTarget(
  state: AppState,
  pageId: BlockId,
  direction: MoveDirection,
): MovePagePayload | undefined {
  const page = selectPage(state, pageId);
  return page === undefined ? undefined : STEPS[direction](state, page);
}

// Where dropping one page on another puts it.
export function selectDropTarget(
  state: AppState,
  pageId: BlockId,
  drop: Drop,
): MovePagePayload | undefined {
  if (selectPage(state, drop.targetId) === undefined) return undefined;
  const move = dropMove(state.workspace, pageId, drop);
  return move === undefined ? undefined : toPayload(move);
}

export const pageMoveCommands = [movePage];
