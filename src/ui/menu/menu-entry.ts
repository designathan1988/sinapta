// What a menu holds: items to choose, labels over groups of items, and
// lines between groups; and which items a search leaves.
import type { IconName } from "../icon/index.ts";

export interface MenuItem {
  readonly kind?: "item";
  readonly label: string;
  readonly onSelect: () => void;
  readonly icon?: IconName;
  readonly isDanger?: boolean;
  readonly isDisabled?: boolean;
  // An option of a group ("radio"), one that turns on and off ("box"),
  // or a setting drawn as a switch ("switch").
  readonly check?: "radio" | "box" | "switch";
  readonly isChecked?: boolean;
  // The setting's current value, muted at the end of the row.
  readonly value?: string;
  // True when choosing the row shows another panel of the menu.
  readonly opensPanel?: boolean;
  // A second line under the label.
  readonly description?: string;
  // Shows the label as a chip of this option color.
  readonly color?: string;
  // An icon at the end of the row, such as an eye that shows the state.
  readonly endIcon?: IconName;
  // Leaves the menu open after the choice, as when a choice goes back to
  // the panel it came from.
  readonly keepsOpen?: boolean;
}

export interface MenuSection {
  readonly kind: "section";
  readonly label: string;
}

export interface MenuDivider {
  readonly kind: "divider";
}

export type MenuEntry = MenuItem | MenuSection | MenuDivider;

export function isMenuItem(entry: MenuEntry): entry is MenuItem {
  return entry.kind === undefined || entry.kind === "item";
}

// Switches, rows that show another panel, and items that say so leave
// the menu open.
export function keepsMenuOpen(item: MenuItem): boolean {
  return (
    item.check === "switch" ||
    item.opensPanel === true ||
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
