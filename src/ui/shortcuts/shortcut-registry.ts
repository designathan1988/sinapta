// Every global keyboard shortcut. A new shortcut is one entry here.
import {
  openOverlay,
  REDO_COMMAND,
  toggleSidebar,
  toggleTheme,
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

// What a shortcut does that is not a command: Notion's navigation keys,
// which the app carries out with the browser and the open page.
export type ShortcutAction =
  | "new-page"
  | "back"
  | "forward"
  | "copy-link"
  | "parent-page"
  | "comment"
  | "move-to";

interface ShortcutKey {
  // Lower-case `KeyboardEvent.key`.
  readonly key: string;
  // Ctrl on Windows and Linux, Command on macOS.
  readonly withModifier: boolean;
  readonly withShift: boolean;
  // Alt as well, as Notion's Ctrl+Alt+L.
  readonly withAlt?: boolean;
}

export type Shortcut = ShortcutKey &
  (
    | { readonly command: Command; readonly action?: undefined }
    | { readonly action: ShortcutAction; readonly command?: undefined }
  );

const navigation = (
  key: string,
  action: ShortcutAction,
  withShift = false,
): Shortcut => ({ key, withModifier: true, withShift, action });

export const SETTINGS_OVERLAY_KIND = "settings";
export const PALETTE_OVERLAY_KIND = "command-palette";
export const SHORTCUT_HELP_OVERLAY_KIND = "shortcut-help";

export const SHORTCUTS: readonly Shortcut[] = [
  navigation("n", "new-page"),
  navigation("[", "back"),
  navigation("]", "forward"),
  navigation("l", "copy-link"),
  // Notion's page menu shows Ctrl+Alt+L for Copy link, and Ctrl+Shift+P
  // for Move to.
  {
    key: "l",
    withModifier: true,
    withShift: false,
    withAlt: true,
    action: "copy-link",
  },
  navigation("p", "move-to", true),
  navigation("u", "parent-page", true),
  navigation("m", "comment", true),
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
    // Notion's other key for search.
    key: "p",
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
  {
    key: "l",
    withModifier: true,
    withShift: true,
    command: toggleTheme.create({}),
  },
  {
    // Ctrl and Shift with "/"; see `keyOf` for keyboards that report "?".
    key: "/",
    withModifier: true,
    withShift: true,
    command: openOverlay.create({
      overlay: { kind: SHORTCUT_HELP_OVERLAY_KIND },
    }),
  },
];

// On most keyboards Shift turns "/" into "?"; both name the same key.
function keyOf(stroke: KeyStroke): string {
  return stroke.key === "?" ? "/" : stroke.key.toLowerCase();
}

export function matchShortcut(
  stroke: KeyStroke,
  shortcuts: readonly Shortcut[] = SHORTCUTS,
): Shortcut | undefined {
  // Keys pressed while composing belong to the input method.
  if (stroke.isComposing) return undefined;
  const hasModifier = stroke.ctrlKey || stroke.metaKey;
  return shortcuts.find(
    (shortcut) =>
      shortcut.key === keyOf(stroke) &&
      shortcut.withModifier === hasModifier &&
      shortcut.withShift === stroke.shiftKey &&
      (shortcut.withAlt === true) === stroke.altKey,
  );
}
