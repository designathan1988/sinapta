import { editorConvertCommands } from "./editor-convert.commands.ts";
import { editorMoveCommands } from "./editor-move.commands.ts";
import { editorPasteCommands } from "./editor-paste.commands.ts";
import { editorSelectionCommands } from "./editor-selection.commands.ts";
import { editorStructureCommands } from "./editor-structure.commands.ts";
import { editorCommands as textCommands } from "./editor.commands.ts";

export { convertBlock } from "./editor-convert.commands.ts";
export { replaceText } from "./editor.commands.ts";
export { renderEditor, renderEditorOverlay } from "./editor.view.ts";

// Every command of the editor, registered in one line at startup.
export const editorCommands = [
  ...textCommands,
  ...editorStructureCommands,
  ...editorConvertCommands,
  ...editorMoveCommands,
  ...editorPasteCommands,
  ...editorSelectionCommands,
];
