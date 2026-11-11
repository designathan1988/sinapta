import { isBlockOfType, type BlockId } from "../../model/index.ts";
import { defineCommand, type AppState } from "../../state/index.ts";
import { toEmbedUrl } from "./embed-hosts.ts";
import {
  EMBED_HEIGHT,
  EMBED_TYPE,
  type EmbedBlock,
  type EmbedProps,
} from "./embed.schema.ts";

function embedOf(state: AppState, blockId: BlockId) {
  const block = state.workspace.blocks[blockId];
  return block !== undefined && isBlockOfType<EmbedBlock>(block, EMBED_TYPE)
    ? block
    : undefined;
}

function patch(block: EmbedBlock, props: Partial<EmbedProps>, now: string) {
  return [
    {
      type: "record.update" as const,
      kind: "block" as const,
      id: block.id,
      patch: { props: { ...block.props, ...props }, updatedAt: now },
    },
  ];
}

// Only an address from an allowed host is taken.
export const setEmbedUrl = defineCommand<{ blockId: BlockId; url: string }>({
  type: "embed.setUrl",
  handle(state, command) {
    const block = embedOf(state, command.blockId);
    const url = command.url.trim();
    if (block === undefined || toEmbedUrl(url) === undefined) return {};
    return { operations: patch(block, { url }, command.meta.now) };
  },
});

// Steps taken one after another, as with the arrow keys, undo as one.
export const setEmbedHeight = defineCommand<{
  blockId: BlockId;
  height: number;
}>({
  type: "embed.setHeight",
  handle(state, command) {
    const block = embedOf(state, command.blockId);
    if (block === undefined || !Number.isFinite(command.height)) return {};
    const { min, max } = EMBED_HEIGHT;
    const height = Math.min(max, Math.max(min, Math.round(command.height)));
    return {
      operations: patch(block, { height }, command.meta.now),
      mergeKey: `embed.setHeight:${block.id}`,
    };
  },
});

export const embedCommands = [setEmbedUrl, setEmbedHeight];
