// The page's notification settings, as Notion's bell in Discussions and
// its page menu's "Get notified" offer them: All comments, or Replies and
// @mentions.
import type { PageBlock } from "../../blocks/page/index.ts";
import {
  selectCommentNotices,
  setCommentNotices,
  type AppState,
  type CommentNoticeLevel,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { MenuItem } from "../../ui/menu/index.ts";

const TEXT = COPY.comments;
const LEVELS: readonly CommentNoticeLevel[] = ["all", "replies"];
const LABELS = { all: TEXT.notifyAll, replies: TEXT.notifyReplies };

export function commentNoticeLabel(state: AppState, page: PageBlock): string {
  return LABELS[selectCommentNotices(state, page.id)];
}

export function commentNoticeItems(
  state: AppState,
  page: PageBlock,
  dispatch: Dispatch,
): MenuItem[] {
  const current = selectCommentNotices(state, page.id);
  return LEVELS.map((level) => ({
    label: LABELS[level],
    check: "radio",
    isChecked: level === current,
    onSelect: () =>
      dispatch(setCommentNotices.create({ pageId: page.id, level })),
  }));
}
