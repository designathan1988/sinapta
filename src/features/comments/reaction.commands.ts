// Reactions, as Notion's: an emoji the owner adds to a comment, or takes
// away; a comment that was only a reaction goes with its last one.
import type { Discussion } from "../../blocks/page/index.ts";
import { removeComment, type BlockId } from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";
import { changeDiscussion, textUpdate } from "./comment.commands.ts";

// The comment with a reaction added, or taken away when it is there; a
// comment that was only a reaction goes when its last one does.
function withReaction(
  comment: Discussion["comments"][number],
  emoji: string,
): Discussion["comments"][number] | null {
  const current = comment.reactions ?? [];
  const reactions = current.includes(emoji)
    ? current.filter((item) => item !== emoji)
    : [...current, emoji];
  if (reactions.length === 0 && comment.text === "") return null;
  const { reactions: _old, ...rest } = comment;
  return reactions.length === 0 ? rest : { ...rest, reactions };
}

export const toggleReaction = defineCommand<{
  pageId: BlockId;
  discussionId: BlockId;
  commentId: BlockId;
  emoji: string;
}>({
  type: "comment.toggleReaction",
  handle(state, command) {
    const result = changeDiscussion(state, command, (discussion) => {
      const comments = discussion.comments.flatMap((item) => {
        if (item.id !== command.commentId) return [item];
        const changed = withReaction(item, command.emoji);
        return changed === null ? [] : [changed];
      });
      return comments.length === 0 ? null : { ...discussion, comments };
    });
    if (result === undefined) return {};
    const unmark =
      result.changed === null
        ? textUpdate(state, result.found.blockId, (current) =>
            removeComment(current, command.discussionId),
          )
        : [];
    return { operations: [result.update, ...unmark] };
  },
});

export const reactionCommands = [toggleReaction];
