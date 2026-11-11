// The shortcuts the reference dialog lists. Global shortcuts are defined
// in src/ui/shortcuts/; the rest belong to the editor and the database,
// and this list describes them for people.
import { COPY } from "../../ui/copy.ts";

export interface ShortcutEntry {
  // Keys pressed together; "Mod" is Ctrl, or Command on a Mac.
  readonly keys: readonly string[];
  readonly label: string;
}

export interface ShortcutGroup {
  readonly title: string;
  readonly entries: readonly ShortcutEntry[];
}

const TEXT = COPY.shortcutHelp;

const entry = (label: string, ...keys: string[]): ShortcutEntry => ({
  keys,
  label,
});

export const SHORTCUT_GROUPS: readonly ShortcutGroup[] = [
  {
    title: TEXT.general,
    entries: [
      entry(TEXT.search, "Mod", "K"),
      entry(TEXT.settings, "Mod", ","),
      entry(TEXT.sidebar, "Mod", "\\"),
      entry(TEXT.theme, "Mod", "Shift", "L"),
      entry(TEXT.undo, "Mod", "Z"),
      entry(TEXT.redo, "Mod", "Shift", "Z"),
      entry(TEXT.redo, "Mod", "Y"),
      entry(TEXT.help, "Mod", "Shift", "/"),
    ],
  },
  {
    title: TEXT.text,
    entries: [
      entry(TEXT.bold, "Mod", "B"),
      entry(TEXT.italic, "Mod", "I"),
      entry(TEXT.underline, "Mod", "U"),
      entry(TEXT.strikethrough, "Mod", "Shift", "S"),
      entry(TEXT.code, "Mod", "E"),
      entry(TEXT.link, "Mod", "K"),
      entry(TEXT.blockMenu, "Mod", "/"),
      entry(TEXT.toolbar, "Alt", "F10"),
      entry(TEXT.newLine, "Shift", "Enter"),
    ],
  },
  {
    title: TEXT.markdown,
    entries: [
      entry(TEXT.slash, "/"),
      entry(TEXT.heading, "#", "Space"),
      entry(TEXT.bullet, "-", "Space"),
      entry(TEXT.numbered, "1.", "Space"),
      entry(TEXT.toDo, "[]", "Space"),
      entry(TEXT.quote, '"', "Space"),
      entry(TEXT.toggle, ">", "Space"),
      entry(TEXT.codeBlock, "```", "Space"),
      entry(TEXT.checked, "[x]", "Space"),
      entry(TEXT.divider, "---", "Space"),
    ],
  },
  {
    title: TEXT.blocks,
    entries: [
      entry(TEXT.indent, "Tab"),
      entry(TEXT.selectBlocks, "Shift", "↑↓"),
      entry(TEXT.moveBlocks, "Alt", "↑↓"),
    ],
  },
  {
    title: TEXT.database,
    entries: [
      entry(TEXT.cellMove, "←↑↓→"),
      entry(TEXT.cellEdit, "Enter"),
      entry(TEXT.cellCancel, "Escape"),
      entry(TEXT.cardMove, "Alt", "←↑↓→"),
    ],
  },
];

const MAC_KEYS: Readonly<Record<string, string>> = {
  Mod: "⌘",
  Alt: "⌥",
  Shift: "⇧",
};

const OTHER_KEYS: Readonly<Record<string, string>> = { Mod: "Ctrl" };

export function keyLabel(key: string, isMac: boolean): string {
  return (isMac ? MAC_KEYS[key] : OTHER_KEYS[key]) ?? key;
}
