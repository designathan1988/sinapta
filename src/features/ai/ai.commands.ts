// Notion AI's answer put in the page: below the block it is about, one
// paragraph per line, or in place of the block's text (ADR-0013).
import { blockDefinition, isTextBlock } from "../../blocks/index.ts";
import { PARAGRAPH_TYPE } from "../../blocks/paragraph/index.ts";
import { parseBlockId, type Operation } from "../../model/index.ts";
import { AI_IDLE, defineCommand, type AppState } from "../../state/index.ts";

function linesOf(answer: string): string[] {
  return answer
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() !== "");
}

function idle(state: AppState) {
  const ai = { ...AI_IDLE, requestCount: state.persistence.ai.requestCount };
  return { ...state.persistence, ai };
}

export const insertAiBelow = defineCommand<{ lineCount: number }>({
  type: "ai.insertBelow",
  newIds: (payload) => ({ blocks: payload.lineCount }),
  handle(state, command) {
    const { blockId, answer } = state.persistence.ai;
    const id = blockId === null ? undefined : parseBlockId(blockId);
    const block = id === undefined ? undefined : state.workspace.blocks[id];
    const parentId = block?.parentId;
    if (block === undefined || parentId == null) return {};
    const siblings = state.workspace.blocks[parentId]?.childIds ?? [];
    const at = siblings.indexOf(block.id) + 1;
    const operations: Operation[] = linesOf(answer).flatMap((line, index) => {
      const newId = command.meta.blockIds[index];
      if (newId === undefined) return [];
      const props =
        blockDefinition(PARAGRAPH_TYPE)?.createProps([{ text: line }]) ?? {};
      const now = command.meta.now;
      const record = {
        id: newId,
        type: PARAGRAPH_TYPE,
        parentId,
        childIds: [],
        props,
        createdAt: now,
        updatedAt: now,
      };
      return [
        { type: "record.create", kind: "block", record },
        {
          type: "list.insert",
          list: { kind: "childIds", blockId: parentId },
          id: newId,
          index: at + index,
        },
      ];
    });
    return { operations, persistence: idle(state) };
  },
});

export const replaceWithAi = defineCommand<Record<string, never>>({
  type: "ai.replace",
  handle(state, command) {
    const { blockId, answer } = state.persistence.ai;
    const id = blockId === null ? undefined : parseBlockId(blockId);
    const block = id === undefined ? undefined : state.workspace.blocks[id];
    if (!isTextBlock(block)) return {};
    const text = [{ text: linesOf(answer).join(" ") }];
    const update: Operation = {
      type: "record.update",
      kind: "block",
      id: block.id,
      patch: { props: { ...block.props, text }, updatedAt: command.meta.now },
    };
    return { operations: [update], persistence: idle(state) };
  },
});

// How many paragraphs the answer makes, for the dispatcher's new ids.
export function answerLineCount(answer: string): number {
  return linesOf(answer).length;
}

export const aiFeatureCommands = [insertAiBelow, replaceWithAi];
