import { editorStructureCommands } from "./editor-structure.commands.ts";
import { editorCommands as textCommands } from "./editor.commands.ts";

export { renderEditor } from "./editor.view.ts";

// Every command of the editor, registered in one line at startup.
export const editorCommands = [...textCommands, ...editorStructureCommands];
