// What a new block made from the slash menu asks for next, as Notion's:
// its own editor (a block equation's TeX, a button's settings), or the
// field it starts from (an address, a table's first cell).
import { BUTTON_CONFIG, BUTTON_TYPE } from "../../blocks/button/index.ts";
import { EQUATION_EDITOR, EQUATION_TYPE } from "../../blocks/equation/index.ts";
import { openOverlay, setSelection, type Dispatch } from "../../state/index.ts";
import { afterRender } from "../../ui/focus/index.ts";

// Blocks that take an address go on to it; a new table, as Notion's, to
// its first cell.
const FIELD_OF: Readonly<Record<string, string>> = {
  "simple-table": "textarea",
};

const ADDRESSED = new Set([
  "image",
  "video",
  "audio",
  "file",
  "pdf",
  "embed",
  "bookmark",
]);

// The editor a new block opens at once, as Notion's: a block equation's
// TeX, a button's settings.
const EDITOR_OF: Readonly<Record<string, string>> = {
  [EQUATION_TYPE]: EQUATION_EDITOR,
  [BUTTON_TYPE]: BUTTON_CONFIG,
};

// What a new block asks for next, as Notion's: a block equation opens its
// TeX editor, a block that takes an address puts the caret in its field.
export function followUp(
  blockType: string,
  blockId: string,
  dispatch: Dispatch,
) {
  const editor = EDITOR_OF[blockType];
  if (editor !== undefined) {
    const overlay = { kind: editor, anchorId: blockId };
    dispatch(openOverlay.create({ overlay }));
  } else if (ADDRESSED.has(blockType) || blockType in FIELD_OF) {
    // The caret leaves the text, so the field keeps the focus.
    dispatch(setSelection.create({ selection: null }));
    const field = FIELD_OF[blockType] ?? "input";
    afterRender(() => {
      document
        .querySelector<HTMLElement>(
          `[data-block-id="${CSS.escape(blockId)}"] ${field}`,
        )
        ?.focus();
    });
  }
}
