// Every global keyboard shortcut. A new shortcut is one entry here.
import {
  openOverlay,
  REDO_COMMAND,
  toggleSidebar,
  UNDO_COMMAND,
  type Command,
} from "../../state/index.ts";

// The part of a keyboard event a shortcut is matched against.
export interface KeyStroke {
  readonly key: string;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly shiftKey: boolean;
  readonly altKey: boolean;
  // True while an input method is composing text.
  readonly isComposing: boolean;
}

export interface Shortcut {
  // Lower-case `KeyboardEvent.key`.
  readonly key: string;
  // Ctrl on Windows and Linux, Command on macOS.
  readonly withModifier: boolean;
  readonly withShift: boolean;
  readonly command: Command;
}

export const SETTINGS_OVERLAY_KIND = "settings";
export const PALETTE_OVERLAY_KIND = "command-palette";

export const SHORTCUTS: readonly Shortcut[] = [
  {
    key: "z",
    withModifier: true,
    withShift: false,
    command: { type: UNDO_COMMAND },
  },
  {
    key: "z",
    withModifier: true,
    withShift: true,
    command: { type: REDO_COMMAND },
  },
  {
    key: "y",
    withModifier: true,
    withShift: false,
    command: { type: REDO_COMMAND },
  },
  {
    key: "\\",
    withModifier: true,
    withShift: false,
    command: toggleSidebar.create({}),
  },
  {
    key: "k",
    withModifier: true,
    withShift: false,
    command: openOverlay.create({ overlay: { kind: PALETTE_OVERLAY_KIND } }),
  },
  {
    key: ",",
    withModifier: true,
    withShift: false,
    command: openOverlay.create({ overlay: { kind: SETTINGS_OVERLAY_KIND } }),
  },
];

export function matchShortcut(
  stroke: KeyStroke,
  shortcuts: readonly Shortcut[] = SHORTCUTS,
): Shortcut | undefined {
  // Keys pressed while composing belong to the input method.
  if (stroke.isComposing || stroke.altKey) return undefined;
  const hasModifier = stroke.ctrlKey || stroke.metaKey;
  return shortcuts.find(
    (shortcut) =>
      shortcut.key === stroke.key.toLowerCase() &&
      shortcut.withModifier === hasModifier &&
      shortcut.withShift === stroke.shiftKey,
  );
}
