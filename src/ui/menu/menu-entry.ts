// What a menu holds: items to choose, labels over groups of items, and
// lines between groups; and which items a search leaves.
import type { nothing, TemplateResult } from "lit-html";
import type { IconName } from "../icon/index.ts";

interface ItemLook {
  readonly kind?: "item";
  readonly label: string;
  readonly icon?: IconName;
  readonly isDanger?: boolean;
  readonly isDisabled?: boolean;
  // An option of a group ("radio"), one that turns on and off ("box"),
  // or a setting drawn as a switch ("switch").
  readonly check?: "radio" | "box" | "switch";
  readonly isChecked?: boolean;
  // The setting's current value, muted at the end of the row.
  readonly value?: string;
  // The keys that do the same, small and muted at the end, as Notion's.
  readonly shortcut?: string;
  // True when choosing the row shows another panel of the menu.
  readonly opensPanel?: boolean;
  // Opens a dialog or a field of its own when chosen, as Notion's Rename;
  // said to screen readers.
  readonly opens?: "dialog";
  // A second line under the label.
  readonly description?: string;
  // Shows the label as a chip of this option color.
  readonly color?: string;
  // Words before the label, as Notion's "Create" before a new option.
  readonly prefix?: string;
  // Shows a square of this option color before the label, in place of an
  // icon, as Notion's lists of colors do.
  readonly swatch?: string;
  // An icon at the end of the row, such as an eye that shows the state.
  readonly endIcon?: IconName;
  // Leaves the menu open after the choice, as when a choice goes back to
  // the panel it came from.
  readonly keepsOpen?: boolean;
}

// What a submenu shows: a menu of its own beside the row, without the
// header and footer of a panel.
export interface SubmenuContent {
  readonly label: string;
  readonly items: readonly MenuEntry[];
  readonly lead?: TemplateResult;
  readonly searchPlaceholder?: string;
  readonly role?: "menu" | "listbox";
  // Full width, for rows with long words, as the counts' 99+ switch.
  readonly isWide?: boolean;
  // Drawn after the rows, as a question one of them asks.
  readonly tail?: TemplateResult | typeof nothing;
}

// A menu the row opens beside its own, as Notion's "Change type".
export interface Submenu {
  // Names the submenu among the overlay's open lists.
  readonly id: string;
  // Built only while the submenu is open.
  readonly menu: () => SubmenuContent;
}

export interface ActionItem extends ItemLook {
  readonly onSelect: () => void;
  readonly submenu?: undefined;
  // The row's own actions, behind a "…" at its end that shows while the
  // row is pointed at, as on Notion's templates.
  readonly more?: Submenu;
}

export interface SubmenuItem extends ItemLook {
  readonly submenu: Submenu;
  readonly onSelect?: undefined;
  readonly more?: undefined;
}

export type MenuItem = ActionItem | SubmenuItem;

export interface MenuSection {
  readonly kind: "section";
  readonly label: string;
}

export interface MenuDivider {
  readonly kind: "divider";
}

// A line of words that says what the menu is for, as Notion's templates
// menu does while it has none.
export interface MenuNote {
  readonly kind: "note";
  readonly label: string;
}

export type MenuEntry = MenuItem | MenuSection | MenuDivider | MenuNote;

export function isMenuItem(entry: MenuEntry): entry is MenuItem {
  return entry.kind === undefined || entry.kind === "item";
}

// Switches, rows that show another panel or a submenu, and items that
// say so leave the menu open.
export function keepsMenuOpen(item: MenuItem): boolean {
  return (
    item.check === "switch" ||
    item.opensPanel === true ||
    item.submenu !== undefined ||
    item.keepsOpen === true
  );
}

function fold(text: string): string {
  return text.normalize("NFKC").toLocaleLowerCase("en-US");
}

// While a search is typed only the items whose label holds it show, in
// their order, without the labels and lines that grouped them.
export function visibleEntries(
  entries: readonly MenuEntry[],
  query: string,
): readonly MenuEntry[] {
  const wanted = fold(query.trim());
  if (wanted === "") return entries;
  return entries.filter(
    (entry) => isMenuItem(entry) && fold(entry.label).includes(wanted),
  );
}
