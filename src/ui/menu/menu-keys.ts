// How a menu answers keys and presses: the arrows move over its own rows
// and open or close submenus, Enter chooses, Escape and Tab close it; a
// choice closes the menu unless the item keeps it open.
import {
  isMenuItem,
  keepsMenuOpen,
  type MenuEntry,
  type MenuItem,
} from "./menu-entry.ts";
import {
  hasSubmenu,
  isMoreOpen,
  openSubmenu,
  toggleMore,
  type MenuContext,
} from "./menu-submenu.ts";

const ITEMS = "[data-index]:not(:disabled)";

// The menu's own rows, not those of a submenu drawn inside it.
function ownRows(menu: Element): HTMLElement[] {
  return [...menu.querySelectorAll<HTMLElement>(ITEMS)].filter(
    (row) => row.closest(".menu") === menu,
  );
}

function moveFocus(menu: Element, key: string): boolean {
  const items = ownRows(menu);
  const current = items.findIndex((item) => item === document.activeElement);
  const targets: Record<string, number> = {
    ArrowDown: (current + 1) % items.length,
    ArrowUp: (current - 1 + items.length) % items.length,
    Home: 0,
    End: items.length - 1,
  };
  const target = targets[key];
  if (target === undefined) return false;
  items[target]?.focus();
  return true;
}

export interface Choosing {
  readonly items: readonly MenuEntry[];
  // Closes this menu alone, as Escape does.
  readonly close: () => void;
  // Closes after a choice: the whole overlay, from a submenu.
  readonly done: () => void;
  readonly context: MenuContext | undefined;
}

// Chooses an item where it was pressed: a row with a submenu opens it.
export function choose(
  item: MenuEntry | undefined,
  choosing: Choosing,
  at: Element,
): void {
  if (item === undefined || !isMenuItem(item) || item.isDisabled === true)
    return;
  if (hasSubmenu(item)) {
    openSubmenu(item, choosing.context, at);
    return;
  }
  if (!keepsMenuOpen(item)) choosing.done();
  item.onSelect();
}

// The arrows open a row's submenu and close the submenu the focus is in;
// in the search field they move the caret.
function onSideKey(
  event: KeyboardEvent,
  choosing: Choosing,
  isSubmenu: boolean,
): boolean {
  if (event.target instanceof HTMLInputElement) return false;
  if (event.key === "ArrowLeft" && isSubmenu) {
    choosing.close();
    return true;
  }
  if (event.key !== "ArrowRight" || !(event.target instanceof HTMLElement)) {
    return false;
  }
  const item = choosing.items[Number(event.target.dataset.index ?? -1)];
  if (item === undefined || !isMenuItem(item)) return false;
  return openBeside(item, choosing, event.target);
}

// Opens what the row shows beside the menu: its actions or its submenu.
function openBeside(
  item: MenuItem,
  choosing: Choosing,
  row: HTMLElement,
): boolean {
  if (item.more !== undefined) {
    const more = row.parentElement?.querySelector(".menu__more");
    if (!isMoreOpen(item, choosing.context) && more instanceof Element) {
      toggleMore(item, choosing.context, more);
    }
    return true;
  }
  if (!hasSubmenu(item)) return false;
  openSubmenu(item, choosing.context, row);
  return true;
}

export function firstItem(entries: readonly MenuEntry[]): MenuItem | undefined {
  return entries.find(
    (entry): entry is MenuItem =>
      isMenuItem(entry) && entry.isDisabled !== true,
  );
}

// A field of the menu, such as a name, keeps its keys; the search field
// passes Up, Down and Enter to the rows.
function isOwnField(target: EventTarget | null): boolean {
  const isField =
    target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
  return isField && target.closest(".menu__search") === null;
}

export function onMenuKey(
  event: KeyboardEvent,
  choosing: Choosing,
  isSubmenu: boolean,
): void {
  const menu = event.currentTarget;
  if (!(menu instanceof Element)) return;
  if (event.key !== "Escape" && isOwnField(event.target)) return;
  const isSearch = event.target instanceof HTMLInputElement;
  if (event.key === "Escape" || event.key === "Tab") choosing.close();
  else if (event.key === "Enter" && isSearch) {
    choose(firstItem(choosing.items), choosing, menu);
  } else if (
    !onSideKey(event, choosing, isSubmenu) &&
    !moveFocus(menu, event.key)
  ) {
    return;
  }
  // A list open inside another overlay keeps its keys to itself.
  event.preventDefault();
  event.stopPropagation();
}
