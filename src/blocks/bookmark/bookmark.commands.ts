import { isBlockOfType, type BlockId } from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";
import {
  BOOKMARK_TYPE,
  safeBookmarkUrl,
  type BookmarkBlock,
} from "./bookmark.schema.ts";

export const setBookmarkUrl = defineCommand<{ blockId: BlockId; url: string }>({
  type: "bookmark.setUrl",
  handle(state, command) {
    const block = state.workspace.blocks[command.blockId];
    const url = safeBookmarkUrl(command.url);
    if (block === undefined || url === undefined) return {};
    if (!isBlockOfType<BookmarkBlock>(block, BOOKMARK_TYPE)) return {};
    const patch = { props: { url }, updatedAt: command.meta.now };
    // A new address is read again: the old preview goes with the old one.
    return {
      operations: [
        { type: "record.update", kind: "block", id: block.id, patch },
      ],
    };
  },
});

export const bookmarkCommands = [setBookmarkUrl];
