// Mentions typed into a block's text: what was typed to find the page or
// date gives way to the mention, then a space, as Notion's (n104), unless
// one follows already; the caret goes after it.
import { isTextBlock } from "../../blocks/index.ts";
import {
  insertMention,
  insertText,
  plainText,
  splitRichText,
  type BlockId,
  type TextSpan,
} from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";
import { caretAt, setText } from "./editor.commands.ts";

export const insertMentionAt = defineCommand<{
  blockId: BlockId;
  start: number;
  end: number;
  span: TextSpan;
}>({
  type: "text.insertMention",
  handle(state, command) {
    const block = state.workspace.blocks[command.blockId];
    if (!isTextBlock(block) || command.span.mention === undefined) return {};
    const { start, end, span } = command;
    const rest = plainText(splitRichText(block.props.text, end)[1]);
    const after = start + span.text.length;
    const mentioned = insertMention(block.props.text, { start, end, span });
    const isSpaced = /^\s/.test(rest);
    const text = isSpaced ? mentioned : insertText(mentioned, after, " ");
    return {
      operations: setText(state, {
        blockId: block.id,
        text,
        now: command.meta.now,
      }),
      ui: {
        ...state.ui,
        selection: caretAt(block.id, after + 1),
      },
    };
  },
});

export const editorMentionCommands = [insertMentionAt];
