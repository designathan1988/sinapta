// What a block in the editor is drawn from, so that a keystroke on a page
// of a thousand blocks draws one block again rather than all of them.
import { blockDefinition } from "../../blocks/index.ts";
import type { Block } from "../../model/index.ts";
import { selectOverlayAt, type AppState } from "../../state/index.ts";
import { selectBlockDiscussionCount } from "../comments/index.ts";

// The values a block's drawing depends on: the block, whether it is
// selected, the menu open beside it, its comment count, and what its type
// shows besides. Undefined when that cannot be said: a type that reads the
// whole workspace, or a block that shows its children, which may change
// while it does not.
export function selectBlockDrawKey(
  state: AppState,
  block: Block,
  isSelected: boolean,
): readonly unknown[] | undefined {
  const definition = blockDefinition(block.type);
  if (definition?.drawnFrom === undefined) return undefined;
  const showsChildren = definition.showsChildren?.(block) ?? true;
  if (showsChildren && block.childIds.length > 0) return undefined;
  return [
    block,
    isSelected,
    selectOverlayAt(state, block.id),
    selectBlockDiscussionCount(state, block.id),
    state.persistence.sync.access,
    ...definition.drawnFrom(block, state),
  ];
}
