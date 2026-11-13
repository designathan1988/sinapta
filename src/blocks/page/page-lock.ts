// Locks, as Notion's: a locked page, or one in the trash, keeps its text,
// blocks and settings; a locked database keeps its properties and views
// while its rows stay free; a locked view keeps its settings. The lock
// itself, favorites and the trash stay free, and a locked page can still
// be deleted whole.
import type {
  Block,
  BlockId,
  Operation,
  View,
  Workspace,
} from "../../model/index.ts";
import { defineCommand, type Guard } from "../../state/index.ts";
import { selectPage } from "./page.selectors.ts";
import { DATABASE_TYPE } from "./page.schema.ts";

// The trash date goes and comes with isTrashed, so it is free too.
const FREE_PROPS = new Set([
  "isLocked",
  "isFavorite",
  "isTrashed",
  "trashedAt",
]);

const isLocked = (block: Block | undefined): boolean =>
  block?.props.isLocked === true;

// A page in the trash is read only, as Notion's, until it is restored.
const isFrozen = (block: Block | undefined): boolean =>
  isLocked(block) || block?.props.isTrashed === true;

interface LockCheck {
  readonly workspace: Workspace;
  // Blocks the command deletes: a lock deleted with its page holds nothing.
  readonly deleted: ReadonlySet<BlockId>;
}

// Whether a locked page holds what is under this block: a locked page
// holds all of it, a locked database only its own settings.
function isHeld(check: LockCheck, blockId: BlockId | null): boolean {
  let id = blockId;
  while (id !== null) {
    const block: Block | undefined = check.workspace.blocks[id];
    if (block === undefined) return false;
    const locks = isFrozen(block) && block.type !== DATABASE_TYPE;
    if (locks) return !check.deleted.has(block.id);
    id = block.parentId;
  }
  return false;
}

function same(a: unknown, b: unknown): boolean {
  return Object.is(a, b) || JSON.stringify(a) === JSON.stringify(b);
}

// A change to a locked block's own settings beyond the free ones.
function changesLockedProps(block: Block | undefined, props: unknown): boolean {
  if (!isFrozen(block) || block === undefined) return false;
  if (typeof props !== "object" || props === null) return false;
  const before: Record<string, unknown> = block.props;
  const after: Record<string, unknown> = { ...props };
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...keys].some(
    (key) => !FREE_PROPS.has(key) && !same(before[key], after[key]),
  );
}

function viewIsLocked(workspace: Workspace, view: View | undefined): boolean {
  if (view === undefined) return false;
  return view.isLocked || isLocked(workspace.blocks[view.databaseId]);
}

function refusesViewChange(check: LockCheck, operation: Operation): boolean {
  const { workspace } = check;
  if (operation.type === "record.create" && operation.kind === "view") {
    return isLocked(workspace.blocks[operation.record.databaseId]);
  }
  if (operation.type === "record.update" && operation.kind === "view") {
    const keys = Object.keys(operation.patch);
    const view = workspace.views[operation.id];
    return (
      viewIsLocked(workspace, view) && keys.some((key) => key !== "isLocked")
    );
  }
  if (operation.type === "record.delete" && operation.kind === "view") {
    return viewIsLocked(workspace, workspace.views[operation.id]);
  }
  return false;
}

// The block whose children an operation changes, or that holds the block
// it changes.
function parentOf(check: LockCheck, operation: Operation): BlockId | null {
  if (operation.type === "list.insert" || operation.type === "list.remove") {
    return operation.list.kind === "childIds" ? operation.list.blockId : null;
  }
  if (operation.kind !== "block") return null;
  if (operation.type === "record.create") return operation.record.parentId;
  return check.workspace.blocks[operation.id]?.parentId ?? null;
}

function refusesBlockChange(check: LockCheck, operation: Operation): boolean {
  if (isHeld(check, parentOf(check, operation))) return true;
  if (operation.type !== "record.update" || operation.kind !== "block") {
    return false;
  }
  const block = check.workspace.blocks[operation.id];
  return changesLockedProps(block, operation.patch.props);
}

export const lockGuard: Guard = (workspace, operations) => {
  const deleted = new Set(
    operations.flatMap((operation) =>
      operation.type === "record.delete" && operation.kind === "block"
        ? [operation.id]
        : [],
    ),
  );
  const check = { workspace, deleted };
  return operations.some(
    (operation) =>
      refusesBlockChange(check, operation) ||
      refusesViewChange(check, operation),
  );
};

// Locks or unlocks a page or a database.
export const setPageLocked = defineCommand<{
  pageId: BlockId;
  isLocked: boolean;
}>({
  type: "page.setLocked",
  handle(state, command) {
    const page = selectPage(state, command.pageId);
    if (page === undefined) return {};
    const props = { ...page.props, isLocked: command.isLocked };
    return {
      operations: [
        { type: "record.update", kind: "block", id: page.id, patch: { props } },
      ],
    };
  },
});

export const pageLockCommands = [setPageLocked];
