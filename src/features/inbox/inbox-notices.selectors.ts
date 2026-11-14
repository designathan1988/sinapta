// The inbox's notices from other people (ADR-0013), as Notion's: where the
// signed-in person is mentioned, and the replies others wrote in the
// discussions they took part in, every comment on the pages set to all
// comments, the changes others made to their pages, the pages shared
// with them, and what automations told them.
import { isTextBlock, textOf } from "../../blocks/index.ts";
import {
  isPageLike,
  selectPageTitle,
  type PageBlock,
} from "../../blocks/page/index.ts";
import type { Block, Workspace } from "../../model/index.ts";
import { selectCommentNotices, type AppState } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { automationNotices, edits, shares } from "./inbox-changes.selectors.ts";
import type { Reminder } from "./inbox.selectors.ts";

function pageOf(workspace: Workspace, block: Block): PageBlock | undefined {
  let id = block.parentId;
  while (id !== null) {
    const parent = workspace.blocks[id];
    if (parent === undefined) return undefined;
    if (isPageLike(parent)) return parent;
    id = parent.parentId;
  }
  return undefined;
}

function titleOf(page: PageBlock): string {
  const title = selectPageTitle(page);
  return title === "" ? COPY.sidebar.untitled : title;
}

function mentions(state: AppState, me: string, read: ReadonlySet<string>) {
  return Object.values(state.workspace.blocks).flatMap((block): Reminder[] => {
    if (!isTextBlock(block)) return [];
    const isMe = block.props.text.some(
      (span) => span.mention?.kind === "person" && span.mention.userId === me,
    );
    const page = isMe ? pageOf(state.workspace, block) : undefined;
    if (page === undefined) return [];
    const key = `${block.id}:mention`;
    return [
      {
        key,
        blockId: block.id,
        pageId: page.id,
        pageTitle: titleOf(page),
        date: block.updatedAt.slice(0, 10),
        text: `${COPY.inbox.mentioned} ${textOf(block)}`,
        isRead: read.has(key),
        isNotice: true,
        kind: "mention",
      },
    ];
  });
}

function replies(state: AppState, me: string, read: ReadonlySet<string>) {
  return Object.values(state.workspace.blocks).flatMap((block): Reminder[] => {
    if (!isPageLike(block)) return [];
    return (block.props.discussions ?? []).flatMap((discussion) => {
      const mine = discussion.comments.findIndex((c) => c.author?.id === me);
      if (mine < 0) return [];
      return discussion.comments.slice(mine + 1).flatMap((comment) => {
        const author = comment.author;
        if (author === undefined || author.id === me) return [];
        const key = `${discussion.id}:${comment.id}`;
        return [
          {
            key,
            blockId: discussion.blockId ?? block.id,
            pageId: block.id,
            pageTitle: titleOf(block),
            date: comment.createdAt.slice(0, 10),
            text: `${author.name} ${COPY.inbox.replied} ${comment.text}`,
            isRead: read.has(key),
            isNotice: true,
            kind: "mention",
          },
        ];
      });
    });
  });
}

// On a page set to all comments, the others' comments in the discussions
// the person has not taken part in (replies cover the others).
function pageComments(state: AppState, me: string, read: ReadonlySet<string>) {
  return Object.values(state.workspace.blocks).flatMap((block): Reminder[] => {
    if (!isPageLike(block)) return [];
    if (selectCommentNotices(state, block.id) !== "all") return [];
    return (block.props.discussions ?? []).flatMap((discussion) => {
      if (discussion.comments.some((c) => c.author?.id === me)) return [];
      return discussion.comments.flatMap((comment) => {
        const author = comment.author;
        if (author === undefined || author.id === me) return [];
        const key = `${discussion.id}:${comment.id}`;
        return [
          {
            key,
            blockId: discussion.blockId ?? block.id,
            pageId: block.id,
            pageTitle: titleOf(block),
            date: comment.createdAt.slice(0, 10),
            text: `${author.name} ${COPY.inbox.commented} ${comment.text}`,
            isRead: read.has(key),
            isNotice: true,
            kind: "mention",
          },
        ];
      });
    });
  });
}

// The notices for the signed-in person; none while no one is.
export function selectNotices(state: AppState): Reminder[] {
  const me = state.persistence.account.user?.id;
  if (me === undefined) return [];
  const read = new Set(state.ui.readReminders);
  const context = { me, read, titleOf };
  return [
    ...mentions(state, me, read),
    ...replies(state, me, read),
    ...pageComments(state, me, read),
    ...edits(state, context),
    ...shares(state, context),
    ...automationNotices(state, context),
  ];
}
