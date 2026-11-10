import type { BlockId, ListRef, Operation } from "../../model/index.ts";
import { defineCommand, type AppState } from "../../state/index.ts";
import { listContaining } from "./page-trash.commands.ts";
import type { PageBlock } from "./page.schema.ts";
import { selectPage } from "./page.selectors.ts";

function idsIn(state: AppState, list: ListRef): readonly BlockId[] {
  if (list.kind === "rootIds") return state.workspace.rootIds;
  return state.workspace.blocks[list.blockId]?.childIds ?? [];
}

function isSelfOrInside(
  state: AppState,
  parentId: BlockId | null,
  pageId: BlockId,
): boolean {
  let current = parentId;
  while (current !== null) {
    if (current === pageId) return true;
    current = state.workspace.blocks[current]?.parentId ?? null;
  }
  return false;
}

export interface MovePagePayload {
  readonly pageId: BlockId;
  readonly parentId: BlockId | null;
  // Position among the new siblings, counted without the moved page.
  readonly index: number;
}

// Moves a page to a parent and position. A page cannot move into itself.
export const movePage = defineCommand<MovePagePayload>({
  type: "page.move",
  handle(state, command) {
    const { pageId, parentId } = command;
    const page = selectPage(state, pageId);
    if (page === undefined || isSelfOrInside(state, parentId, pageId))
      return {};
    if (parentId !== null && selectPage(state, parentId) === undefined)
      return {};
    const from = listContaining(page);
    const to: ListRef =
      parentId === null
        ? { kind: "rootIds" }
        : { kind: "childIds", blockId: parentId };
    const siblings = idsIn(state, to).filter((id) => id !== pageId);
    const index = Math.max(0, Math.min(command.index, siblings.length));
    if (
      page.parentId === parentId &&
      idsIn(state, from).indexOf(pageId) === index
    ) {
      return {};
    }
    const operations: Operation[] = [
      { type: "list.remove", list: from, id: pageId },
      { type: "list.insert", list: to, id: pageId, index },
      { type: "record.update", kind: "block", id: pageId, patch: { parentId } },
    ];
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
    const siblings = idsIn(state, listContaining(page));
    const index = siblings.indexOf(page.id) + offset;
    if (index < 0 || index >= siblings.length) return undefined;
    return { pageId: page.id, parentId: page.parentId, index };
  };
}

// Becomes the last child of the page above it.
const stepIn: Step = (state, page) => {
  const siblings = idsIn(state, listContaining(page));
  const above = siblings[siblings.indexOf(page.id) - 1];
  if (above === undefined) return undefined;
  const index = state.workspace.blocks[above]?.childIds.length ?? 0;
  return { pageId: page.id, parentId: above, index };
};

// Goes right after its parent.
const stepOut: Step = (state, page) => {
  const parent = selectPage(state, page.parentId);
  if (parent === undefined) return undefined;
  const index = idsIn(state, listContaining(parent)).indexOf(parent.id) + 1;
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

export type DropPosition = "before" | "after" | "inside";

// Where dropping one page on another puts it.
export function selectDropTarget(
  state: AppState,
  pageId: BlockId,
  drop: { readonly targetId: BlockId; readonly position: DropPosition },
): MovePagePayload | undefined {
  const target = selectPage(state, drop.targetId);
  if (target === undefined || drop.targetId === pageId) return undefined;
  if (drop.position === "inside") {
    const count = target.childIds.filter((id) => id !== pageId).length;
    return { pageId, parentId: target.id, index: count };
  }
  const siblings = idsIn(state, listContaining(target)).filter(
    (id) => id !== pageId,
  );
  const index =
    siblings.indexOf(target.id) + (drop.position === "after" ? 1 : 0);
  return { pageId, parentId: target.parentId, index };
}

export const pageMoveCommands = [movePage];
