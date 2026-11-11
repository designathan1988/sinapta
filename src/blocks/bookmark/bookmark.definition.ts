import { isBlockOfType } from "../../model/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { BlockDefinition } from "../block-definition.ts";
import { PARAGRAPH_TYPE } from "../paragraph/index.ts";
import { bookmarkCommands } from "./bookmark.commands.ts";
import {
  BOOKMARK_TYPE,
  bookmarkPropsSchema,
  type BookmarkBlock,
} from "./bookmark.schema.ts";
import { renderBookmark } from "./bookmark.view.ts";

export const bookmarkDefinition: BlockDefinition = {
  type: BOOKMARK_TYPE,
  label: COPY.blockNames.bookmark,
  propsSchema: bookmarkPropsSchema,
  continuesAs: PARAGRAPH_TYPE,
  createProps: () => ({ url: "" }),
  commands: bookmarkCommands,
  render: (block, dispatch) =>
    isBlockOfType<BookmarkBlock>(block, BOOKMARK_TYPE)
      ? renderBookmark(block, dispatch)
      : undefined,
};
