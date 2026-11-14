import { editorColorCommands } from "./editor-color.commands.ts";
import { editorConvertCommands } from "./editor-convert.commands.ts";
import { editorEquationCommands } from "./editor-equation.commands.ts";
import { editorMentionCommands } from "./editor-mention.commands.ts";
import { editorInsertCommands } from "./editor-insert.commands.ts";
import { editorMoveCommands } from "./editor-move.commands.ts";
import { editorPlusCommands } from "./editor-plus.commands.ts";
import { editorPasteBlocksCommands } from "./editor-paste-blocks.commands.ts";
import { editorPasteAsCommands } from "./editor-paste-as.commands.ts";
import { editorPasteCommands } from "./editor-paste.commands.ts";
import { editorSelectionCommands } from "./editor-selection.commands.ts";
import { editorStructureCommands } from "./editor-structure.commands.ts";
import { editorCommands as textCommands } from "./editor.commands.ts";

export { setBlockColor } from "./editor-color.commands.ts";
export { writeSystemClipboard } from "./editor-clipboard.view.ts";
export { insertMentionAt } from "./editor-mention.commands.ts";
export { createSubpageAt, linkPageAt } from "./editor-plus.commands.ts";
export { convertBlock } from "./editor-convert.commands.ts";
export { moveBlocksToPage } from "./editor-move.commands.ts";
export { propsFor as pastedBlockProps } from "./editor-paste-blocks.commands.ts";
export { selectPageIdOf } from "./editor.selectors.ts";
export {
  clearTextFormat,
  replaceText,
  setTextTone,
  toggleTextMark,
} from "./editor.commands.ts";
export { makeInlineEquation } from "./editor-equation.commands.ts";
export {
  blockTypeName,
  TURN_INTO_OVERLAY,
} from "./editor-block-actions.view.ts";
export { BLOCK_MENU_OVERLAY } from "./editor-block-menu.view.ts";
export { openLinkField } from "./editor-link.view.ts";
export { renderEditor, renderEditorOverlay } from "./editor.view.ts";

// Every command of the editor, registered in one line at startup.
export const editorCommands = [
  ...textCommands,
  ...editorStructureCommands,
  ...editorConvertCommands,
  ...editorColorCommands,
  ...editorMentionCommands,
  ...editorPlusCommands,
  ...editorInsertCommands,
  ...editorMoveCommands,
  ...editorPasteCommands,
  ...editorPasteAsCommands,
  ...editorPasteBlocksCommands,
  ...editorSelectionCommands,
  ...editorEquationCommands,
];
export { SLASH_MENU_OVERLAY } from "./editor-slash.selectors.ts";
