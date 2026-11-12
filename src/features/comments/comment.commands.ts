// Comments, as Notion's: discussions on a page or on a block's text, each
// a list of comments; replying, resolving and deleting. A discussion on
// text marks the text, until it is resolved or its last comment goes.
import { isTextBlock } from "../../blocks/index.ts";
import {
  selectPage,
  type Discussion,
  type PageBlock,
} from "../../blocks/page/index.ts";
import {
  addComment,
  removeComment,
  textOfRange,
  type BlockId,
  type CommentRange,
  type Operation,
  type RichText,
} from "../../model/index.ts";
import { defineCommand, type AppState } from "../../state/index.ts";

function discussionsUpdate(
  page: PageBlock,
  discussions: readonly Discussion[],
): Operation {
  const props = { ...page.props, discussions: [...discussions] };
  return {
    type: "record.update",
    kind: "block",
    id: page.id,
    patch: { props },
  };
}

// The block's text with a discussion marked on a range, or unmarked.
function textUpdate(
  state: AppState,
  blockId: BlockId | null,
  change: (text: RichText) => RichText,
): Operation[] {
  const block = blockId === null ? undefined : state.workspace.blocks[blockId];
  if (!isTextBlock(block)) return [];
  const text = change(block.props.text);
  const props = { ...block.props, text };
  return [
    { type: "record.update", kind: "block", id: block.id, patch: { props } },
  ];
}

function textOfBlock(state: AppState, blockId: BlockId | null) {
  const block = blockId === null ? undefined : state.workspace.blocks[blockId];
  return isTextBlock(block) ? block.props.text : undefined;
}

export interface StartDiscussionPayload {
  readonly pageId: BlockId;
  // The block it is about, or null for the page.
  readonly blockId: BlockId | null;
  // The text it is about, in the block.
  readonly range?: CommentRange;
  readonly text: string;
}

export const startDiscussion = defineCommand<StartDiscussionPayload>({
  type: "comment.start",
  newBlockIds: 2,
  handle(state, command) {
    const page = selectPage(state, command.pageId);
    const [id, commentId] = command.meta.blockIds;
    const text = command.text.trim();
    if (page === undefined || id === undefined || commentId === undefined)
      return {};
    if (text === "") return {};
    const { blockId, range } = command;
    const rich = textOfBlock(state, blockId);
    const quote =
      range === undefined || rich === undefined
        ? undefined
        : textOfRange(rich, range);
    const comment = { id: commentId, text, createdAt: command.meta.now };
    const discussion: Discussion = {
      id,
      blockId,
      ...(quote !== undefined && { quote }),
      isResolved: false,
      comments: [comment],
    };
    const marks =
      range === undefined
        ? []
        : textUpdate(state, blockId, (current) =>
            addComment(current, range, id),
          );
    const discussions = [...(page.props.discussions ?? []), discussion];
    return { operations: [discussionsUpdate(page, discussions), ...marks] };
  },
});

function changeDiscussion(
  state: AppState,
  target: { readonly pageId: BlockId; readonly discussionId: BlockId },
  change: (discussion: Discussion) => Discussion | null,
) {
  const page = selectPage(state, target.pageId);
  const discussions = page?.props.discussions ?? [];
  const found = discussions.find((item) => item.id === target.discussionId);
  if (page === undefined || found === undefined) return undefined;
  const changed = change(found);
  const next = discussions.flatMap((item) =>
    item.id !== found.id ? [item] : changed === null ? [] : [changed],
  );
  return { page, found, changed, update: discussionsUpdate(page, next) };
}

export const replyToDiscussion = defineCommand<{
  pageId: BlockId;
  discussionId: BlockId;
  text: string;
}>({
  type: "comment.reply",
  newBlockIds: 1,
  handle(state, command) {
    const [id] = command.meta.blockIds;
    const text = command.text.trim();
    if (id === undefined || text === "") return {};
    const comment = { id, text, createdAt: command.meta.now };
    const result = changeDiscussion(state, command, (discussion) => ({
      ...discussion,
      comments: [...discussion.comments, comment],
    }));
    return result === undefined ? {} : { operations: [result.update] };
  },
});

// Resolving hides a discussion and unmarks its text; reopening shows it.
export const resolveDiscussion = defineCommand<{
  pageId: BlockId;
  discussionId: BlockId;
  isResolved: boolean;
}>({
  type: "comment.resolve",
  handle(state, command) {
    const { isResolved, discussionId } = command;
    const result = changeDiscussion(state, command, (discussion) => ({
      ...discussion,
      isResolved,
    }));
    if (result === undefined) return {};
    const unmark = isResolved
      ? textUpdate(state, result.found.blockId, (current) =>
          removeComment(current, discussionId),
        )
      : [];
    return { operations: [result.update, ...unmark] };
  },
});

// Deletes a comment; a discussion without comments goes with its marks.
export const deleteComment = defineCommand<{
  pageId: BlockId;
  discussionId: BlockId;
  commentId: BlockId;
}>({
  type: "comment.delete",
  handle(state, command) {
    const { discussionId, commentId } = command;
    const result = changeDiscussion(state, command, (discussion) => {
      const comments = discussion.comments.filter(
        (item) => item.id !== commentId,
      );
      return comments.length === 0 ? null : { ...discussion, comments };
    });
    if (result === undefined) return {};
    const unmark =
      result.changed === null
        ? textUpdate(state, result.found.blockId, (current) =>
            removeComment(current, discussionId),
          )
        : [];
    return { operations: [result.update, ...unmark] };
  },
});

export const commentCommands = [
  startDiscussion,
  replyToDiscussion,
  resolveDiscussion,
  deleteComment,
];

export { discussionTidier } from "./discussion-tidy.ts";
