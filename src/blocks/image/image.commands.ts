import {
  isBlockOfType,
  safeImageSource,
  type BlockId,
  type Operation,
} from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";
import {
  IMAGE_TYPE,
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

export const imageCommands = [setImageSource, setImageCaption];
