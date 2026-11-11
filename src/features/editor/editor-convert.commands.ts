// Turning one kind of block into another.
import { blockDefinition, isTextBlock } from "../../blocks/index.ts";
import { PARAGRAPH_TYPE } from "../../blocks/paragraph/index.ts";
import {
  splitRichText,
  type Block,
  type BlockId,
  type BlockProps,
  type Operation,
} from "../../model/index.ts";
import { defineCommand, type AppState } from "../../state/index.ts";
import {
  childList,
  createBlock,
  indexIn,
  withSelection,
  type NewBlock,
} from "./editor-operations.ts";

export interface ConvertBlockPayload {
  readonly blockId: BlockId;
  // The block type to turn into.
  readonly blockType: string;
  readonly extraProps?: BlockProps;
  // Leading characters to drop, such as the "# " that asked for a heading.
  readonly removePrefix?: number;
}

function paragraphAfter(
  state: AppState,
  block: Block,
  spec: Omit<NewBlock, "type" | "text" | "parentId">,
): Operation[] {
  if (block.parentId === null) return [];
  const { parentId } = block;
  const record = createBlock({
    ...spec,
    type: PARAGRAPH_TYPE,
    parentId,
    text: [],
  });
  const index = indexIn(state, block) + 1;
  return [
    { type: "record.create", kind: "block", record },
    { type: "list.insert", list: childList(parentId), id: spec.id, index },
  ];
}

// Turns a text block into another type. A block that becomes one without
// text, such as a divider, is followed by a new paragraph for the caret.
export const convertBlock = defineCommand<ConvertBlockPayload>({
  type: "block.convert",
  newBlockIds: 1,
  handle(state, command) {
    const block = state.workspace.blocks[command.blockId];
    const definition = blockDefinition(command.blockType);
    const id = command.meta.blockIds[0];
    if (!isTextBlock(block) || definition === undefined || id === undefined)
      return {};
    const { now } = command.meta;
    const [, text] = splitRichText(block.props.text, command.removePrefix ?? 0);
    const props = { ...definition.createProps(text), ...command.extraProps };
    const patch = { type: command.blockType, props, updatedAt: now };
    const update: Operation = {
      type: "record.update",
      kind: "block",
      id: block.id,
      patch,
    };
    if ("text" in props) {
      return { operations: [update], ui: withSelection(state, block.id, 0) };
    }
    return {
      operations: [update, ...paragraphAfter(state, block, { id, now })],
      ui: withSelection(state, id, 0),
    };
  },
});

export const editorConvertCommands = [convertBlock];
