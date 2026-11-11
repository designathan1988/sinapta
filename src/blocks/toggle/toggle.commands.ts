import {
  isBlockOfType,
  type Block,
  type BlockId,
  type Operation,
  type Workspace,
} from "../../model/index.ts";
import { PAGE_LIKE_TYPES } from "../page/index.ts";
import { defineCommand } from "../../state/index.ts";
import { TOGGLE_TYPE, type ToggleBlock } from "./toggle.schema.ts";

// Shows or hides what is inside a toggle.
export const setToggleOpen = defineCommand<{
  blockId: BlockId;
  isOpen: boolean;
}>({
  type: "toggle.setOpen",
  handle(state, command) {
    const block = state.workspace.blocks[command.blockId];
    if (
      block === undefined ||
      !isBlockOfType<ToggleBlock>(block, TOGGLE_TYPE)
    ) {
      return {};
    }
    if (block.props.isOpen === command.isOpen) return {};
    const props = { ...block.props, isOpen: command.isOpen };
    return {
      operations: [
        {
          type: "record.update",
          kind: "block",
          id: block.id,
          patch: { props },
        },
      ],
    };
  },
});

// A toggle block, or a block that can be toggled, such as a toggle
// heading.
export function isTogglable(block: Block): boolean {
  return block.type === TOGGLE_TYPE || block.props.isToggleable === true;
}

// The toggles of a page, nested ones included; a subpage keeps its own.
function togglesIn(workspace: Workspace, parent: Block): Block[] {
  return parent.childIds.flatMap((id) => {
    const block = workspace.blocks[id];
    if (block === undefined || PAGE_LIKE_TYPES.includes(block.type)) return [];
    const inside = togglesIn(workspace, block);
    return isTogglable(block) ? [block, ...inside] : inside;
  });
}

// Opens or closes every toggle of a page at once (Ctrl+Alt+T).
export const setAllTogglesOpen = defineCommand<{
  pageId: BlockId;
  isOpen: boolean;
}>({
  type: "toggle.setAllOpen",
  handle(state, command) {
    const page = state.workspace.blocks[command.pageId];
    if (page === undefined) return {};
    const operations = togglesIn(state.workspace, page)
      .filter((block) => block.props.isOpen !== command.isOpen)
      .map((block): Operation => ({
        type: "record.update",
        kind: "block",
        id: block.id,
        patch: { props: { ...block.props, isOpen: command.isOpen } },
      }));
    return { operations };
  },
});

export const toggleCommands = [setToggleOpen, setAllTogglesOpen];
