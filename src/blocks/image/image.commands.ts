import {
  isBlockOfType,
  safeImageSource,
  type BlockId,
  type Operation,
} from "../../model/index.ts";
import { defineCommand, type AppState } from "../../state/index.ts";
import {
  IMAGE_TYPE,
  IMAGE_WIDTH,
  type ImageAlign,
  type ImageBlock,
  type ImageProps,
} from "./image.schema.ts";

function patchImage(
  block: ImageBlock,
  props: Partial<ImageProps>,
  now: string,
): Operation[] {
  return [
    {
      type: "record.update",
      kind: "block",
      id: block.id,
      patch: { props: { ...block.props, ...props }, updatedAt: now },
    },
  ];
}

// Shows an image from a web address or from data read from a file.
// Anything else is refused.
export const setImageSource = defineCommand<{ blockId: BlockId; src: string }>({
  type: "image.setSource",
  handle(state, command) {
    const block = state.workspace.blocks[command.blockId];
    const src = safeImageSource(command.src);
    if (block === undefined || src === undefined) return {};
    if (!isBlockOfType<ImageBlock>(block, IMAGE_TYPE)) return {};
    return { operations: patchImage(block, { src }, command.meta.now) };
  },
});

export const setImageCaption = defineCommand<{
  blockId: BlockId;
  caption: string;
}>({
  type: "image.setCaption",
  handle(state, command) {
    const block = state.workspace.blocks[command.blockId];
    if (block === undefined || !isBlockOfType<ImageBlock>(block, IMAGE_TYPE))
      return {};
    const caption = command.caption.normalize("NFC");
    if (caption === block.props.caption) return {};
    return { operations: patchImage(block, { caption }, command.meta.now) };
  },
});

function imageBlock(state: AppState, blockId: BlockId) {
  const block = state.workspace.blocks[blockId];
  return block !== undefined && isBlockOfType<ImageBlock>(block, IMAGE_TYPE)
    ? block
    : undefined;
}

// A width outside 10 to 100 percent is brought inside it.
export const setImageWidth = defineCommand<{
  blockId: BlockId;
  width: number;
}>({
  type: "image.setWidth",
  handle(state, command) {
    const block = imageBlock(state, command.blockId);
    if (block === undefined || !Number.isFinite(command.width)) return {};
    const { min, max } = IMAGE_WIDTH;
    const width = Math.min(max, Math.max(min, Math.round(command.width)));
    if (width === (block.props.width ?? max)) return {};
    // Steps taken one after another, as with the arrow keys, undo as one.
    return {
      operations: patchImage(block, { width }, command.meta.now),
      mergeKey: `image.setWidth:${block.id}`,
    };
  },
});

export const setImageAlign = defineCommand<{
  blockId: BlockId;
  align: ImageAlign;
}>({
  type: "image.setAlign",
  handle(state, command) {
    const block = imageBlock(state, command.blockId);
    const { align } = command;
    if (block === undefined || align === (block.props.align ?? "center"))
      return {};
    return { operations: patchImage(block, { align }, command.meta.now) };
  },
});

export const imageCommands = [
  setImageSource,
  setImageCaption,
  setImageWidth,
  setImageAlign,
];
