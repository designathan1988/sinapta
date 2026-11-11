// Builds a page of blocks for the editor's tests.
import { isTextBlock, textOf } from "../../blocks/text-block.ts";
import {
  buildWorkspace,
  toBlockId,
  type BlockSpec,
} from "../../model/index.ts";
import { createTestApp } from "../../state/index.ts";
import { editorConvertCommands } from "./editor-convert.commands.ts";
import { editorInsertCommands } from "./editor-insert.commands.ts";
import { editorMoveCommands } from "./editor-move.commands.ts";
import { editorPasteBlocksCommands } from "./editor-paste-blocks.commands.ts";
import { editorPasteCommands } from "./editor-paste.commands.ts";
import { editorSelectionCommands } from "./editor-selection.commands.ts";
import { editorStructureCommands } from "./editor-structure.commands.ts";
import { editorCommands } from "./editor.commands.ts";

export const PAGE = toBlockId("page");

export function text(id: string, value: string, type = "paragraph"): BlockSpec {
  const props = type === "to-do" ? { isChecked: false } : {};
  return {
    id,
    type,
    props: { ...props, text: value === "" ? [] : [{ text: value }] },
  };
}

export function createApp(blocks: BlockSpec[]) {
  const workspace = buildWorkspace([{ id: "page", children: blocks }]);
  const commands = [
    ...editorCommands,
    ...editorStructureCommands,
    ...editorConvertCommands,
    ...editorInsertCommands,
    ...editorMoveCommands,
    ...editorPasteCommands,
    ...editorPasteBlocksCommands,
    ...editorSelectionCommands,
  ];
  const app = createTestApp({ workspace, commands });
  // The page's content as "type:text" with two spaces of indent per level.
  const outline = (parentId = PAGE, depth = 0): string[] =>
    (app.store.getState().workspace.blocks[parentId]?.childIds ?? []).flatMap(
      (id) => {
        const block = app.store.getState().workspace.blocks[id];
        if (!isTextBlock(block)) return [];
        const line = `${"  ".repeat(depth)}${block.type}:${textOf(block)}`;
        return [line, ...outline(id, depth + 1)];
      },
    );
  return { ...app, outline };
}
