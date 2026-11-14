// What a menu is drawn from: its rows, its header and search, and where
// it sits.
import type { TemplateResult, nothing } from "lit-html";
import type { MenuEntry } from "./menu-entry.ts";
import type { MenuContext } from "./menu-submenu.ts";

export interface MenuSearch {
  readonly placeholder: string;
  readonly query: string;
  readonly onQuery: (query: string) => void;
}

export interface MenuOptions {
  readonly label: string;
  readonly items: readonly MenuEntry[];
  // Called when the menu should close: after a choice, Escape or Tab.
  readonly onClose: () => void;
  // Called instead of onClose after a choice, when that closes more than
  // this menu, as a choice in a submenu closes the whole overlay.
  readonly onDone?: () => void;
  // A short note under the items, such as a page's word count.
  readonly footer?: string;
  // Where a menu opened by a right click shows; otherwise it sits by the
  // control that opened it.
  readonly point?: { readonly x: number; readonly y: number };
  // A header with this title and a close button, and a back button when
  // the panel was reached from another one.
  readonly title?: string;
  readonly onBack?: () => void;
  readonly search?: MenuSearch;
  // "listbox" for choosing one value among options.
  readonly role?: "menu" | "listbox";
  // Content above the rows, such as a name field or layout tiles.
  readonly lead?: TemplateResult;
  // Content under the rows, such as a card layout's tiles.
  readonly tail?: TemplateResult | typeof nothing;
  // A submenu as wide as a menu, for rows with long words.
  readonly isWide?: boolean;
  // A long list kept short and scrolled, as Notion's list of times.
  readonly isShort?: boolean;
  // Rows 8 px from the panel's edge, as Notion's view settings, not 4.
  readonly isInset?: boolean;
  // A list opened from a control inside another overlay.
  readonly isChild?: boolean;
  // A submenu sits beside the row that opened it, not under it; an editor
  // of a cell lies over the cell, at least as wide.
  readonly placement?: "beside" | "over" | "before";
  // The open overlay, for menus whose rows open submenus.
  readonly context?: MenuContext;
}
