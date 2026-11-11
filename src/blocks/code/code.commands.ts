// The language, line wrapping and caption of a code block.
import {
  isBlockOfType,
  type BlockId,
  type Operation,
} from "../../model/index.ts";
import { defineCommand, type AppState } from "../../state/index.ts";
import {
  CODE_TYPE,
  type CodeBlock,
  type CodeLanguage,
  type CodeProps,
} from "./code.schema.ts";

function codeBlock(state: AppState, blockId: BlockId): CodeBlock | undefined {
  const block = state.workspace.blocks[blockId];
  return block !== undefined && isBlockOfType<CodeBlock>(block, CODE_TYPE)
    ? block
    : undefined;
}

function replaceProps(
  block: CodeBlock,
  props: CodeProps,
  now: string,
): { operations: Operation[] } {
  const patch = { props, updatedAt: now };
  return {
    operations: [{ type: "record.update", kind: "block", id: block.id, patch }],
  };
}

function patchCode(block: CodeBlock, props: Partial<CodeProps>, now: string) {
  return replaceProps(block, { ...block.props, ...props }, now);
}

export const setCodeLanguage = defineCommand<{
  blockId: BlockId;
  language: CodeLanguage;
}>({
  type: "code.setLanguage",
  handle(state, command) {
    const block = codeBlock(state, command.blockId);
    if (block === undefined) return {};
    if ((block.props.language ?? "plain") === command.language) return {};
    return patchCode(block, { language: command.language }, command.meta.now);
  },
});

export const toggleCodeWrap = defineCommand<{ blockId: BlockId }>({
  type: "code.toggleWrap",
  handle(state, command) {
    const block = codeBlock(state, command.blockId);
    if (block === undefined) return {};
    const isWrapped = block.props.isWrapped !== true;
    return patchCode(block, { isWrapped }, command.meta.now);
  },
});

// The caption is edited as plain text and kept as one span. An empty
// caption stays, so that it can be written; null removes it.
export const setCodeCaption = defineCommand<{
  blockId: BlockId;
  caption: string | null;
}>({
  type: "code.setCaption",
  handle(state, command) {
    const block = codeBlock(state, command.blockId);
    if (block === undefined) return {};
    const { now } = command.meta;
    if (command.caption === null) {
      const { caption, ...rest } = block.props;
      if (caption === undefined) return {};
      return replaceProps(block, rest, now);
    }
    const text = command.caption.normalize("NFC");
    const caption = text === "" ? [] : [{ text }];
    return replaceProps(block, { ...block.props, caption }, now);
  },
});

export const codeCommands = [setCodeLanguage, toggleCodeWrap, setCodeCaption];
