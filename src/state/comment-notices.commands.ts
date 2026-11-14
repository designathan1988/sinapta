// Sets a page's comment notices, as Notion's page notification settings.
import type { BlockId } from "../model/index.ts";
import type { CommentNoticeLevel } from "./app-state.ts";
import { defineCommand } from "./command-registry.ts";

export const setCommentNotices = defineCommand<{
  pageId: BlockId;
  level: CommentNoticeLevel;
}>({
  type: "inbox.setCommentNotices",
  handle: (state, { pageId, level }) => ({
    ui: {
      ...state.ui,
      commentNotices: { ...state.ui.commentNotices, [pageId]: level },
    },
  }),
});
