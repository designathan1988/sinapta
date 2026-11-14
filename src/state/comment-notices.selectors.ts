// Which comments on a page bring the signed-in person a notice, as Notion's
// page notification settings: All comments, by default on a page they
// made, or Replies and @mentions only.
import type { BlockId } from "../model/index.ts";
import type { AppState, CommentNoticeLevel } from "./app-state.ts";

export function selectCommentNotices(
  state: AppState,
  pageId: BlockId,
): CommentNoticeLevel {
  const set = state.ui.commentNotices[pageId];
  if (set !== undefined) return set;
  const me = state.persistence.account.user?.id;
  const maker = state.workspace.blocks[pageId]?.createdBy?.id;
  return maker === undefined || maker === me ? "all" : "replies";
}
