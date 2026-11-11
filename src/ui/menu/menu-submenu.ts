// Submenus: a row that opens a menu of its own beside the menu, as
// Notion's "Change type" or "Sort". Which ones are open lives in the
// overlay's open lists; a submenu inside a submenu opens one level deeper.
import { nothing, type TemplateResult } from "lit-html";
import {
  closeChildOverlay,
  closeOverlay,
  openChildOverlay,
  setOverlayQuery,
  type Dispatch,
  type OpenOverlay,
} from "../../state/index.ts";
import { childDepthOf, childIndexOf } from "../overlay/index.ts";
import {
  isMenuItem,
  type MenuEntry,
  type MenuItem,
  type SubmenuItem,
} from "./menu-entry.ts";

// What a menu with submenus reads and changes: the open overlay.
export interface MenuContext {
  readonly overlay: OpenOverlay | null;
  readonly dispatch: Dispatch;
}

// What a submenu is drawn with, as the menu's own options are.
export interface SubmenuOptions {
  readonly label: string;
  readonly items: readonly MenuEntry[];
  readonly lead?: TemplateResult;
  readonly role?: "menu" | "listbox";
  readonly isChild: true;
  readonly placement: "beside";
  readonly context: MenuContext;
  readonly search?: {
    readonly placeholder: string;
    readonly query: string;
    readonly onQuery: (query: string) => void;
  };
  readonly onClose: () => void;
  readonly onDone: () => void;
}

export function hasSubmenu(item: MenuItem): item is SubmenuItem {
  return item.submenu !== undefined;
}

export function isSubmenuOpen(
  item: MenuItem,
  context: MenuContext | undefined,
): boolean {
  return (
    item.submenu !== undefined &&
    childIndexOf(context?.overlay ?? null, item.submenu.id) !== -1
  );
}

// Opens the row's submenu beside the menu the row is in.
export function openSubmenu(
  item: SubmenuItem,
  context: MenuContext | undefined,
  row: Element,
): void {
  if (context === undefined || isSubmenuOpen(item, context)) return;
  const depth = childDepthOf(row);
  context.dispatch(
    openChildOverlay.create({ anchorId: item.submenu.id, depth }),
  );
}

// A search field in a submenu searches it alone.
function submenuSearch(
  placeholder: string | undefined,
  context: MenuContext,
  index: number,
): Pick<SubmenuOptions, "search"> {
  if (placeholder === undefined) return {};
  const query = context.overlay?.children?.[index]?.query ?? "";
  const onQuery = (next: string): void => {
    context.dispatch(setOverlayQuery.create({ query: next }));
  };
  return { search: { placeholder, query, onQuery } };
}

// The open submenu of a row, drawn by the menu's own renderer.
export function renderSubmenu(
  item: MenuItem,
  context: MenuContext | undefined,
  draw: (options: SubmenuOptions) => TemplateResult,
): TemplateResult | typeof nothing {
  if (!hasSubmenu(item) || context === undefined) return nothing;
  const index = childIndexOf(context.overlay, item.submenu.id);
  if (index === -1) return nothing;
  const { dispatch } = context;
  const { searchPlaceholder, ...content } = item.submenu.menu();
  return draw({
    ...content,
    isChild: true,
    placement: "beside",
    context,
    ...submenuSearch(searchPlaceholder, context, index),
    onClose: () => dispatch(closeChildOverlay.create({ depth: index })),
    onDone: () => dispatch(closeOverlay.create({})),
  });
}

// A mouse resting on a row with a submenu opens it, as in Notion.
export function onSubmenuHover(
  event: PointerEvent,
  items: readonly MenuEntry[],
  context: MenuContext | undefined,
): void {
  if (event.pointerType !== "mouse" || !(event.target instanceof Element)) {
    return;
  }
  const row = event.target.closest<HTMLElement>("[data-index]");
  if (row === null) return;
  if (row.closest(".menu") !== event.currentTarget) return;
  const item = items[Number(row.dataset.index ?? -1)];
  if (item === undefined || !isMenuItem(item)) return;
  if (hasSubmenu(item) && item.isDisabled !== true) {
    openSubmenu(item, context, row);
  }
}
