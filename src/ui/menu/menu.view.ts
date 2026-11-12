// A menu in the top layer, drawn as Notion draws its menus: an optional
// header with a back and a close button, an optional search field, then
// rows, labels and lines. A listbox is the same panel for choosing one
// value. It is rendered only while it is open.
import "./menu.css";
import "./menu-field.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { COPY } from "../copy.ts";
import { focusOnce } from "../focus/index.ts";
import { renderIcon } from "../icon/index.ts";
import {
  focusOverlayAnchor,
  showPopoverWhenConnected,
} from "../overlay/index.ts";
import { isMenuItem, visibleEntries, type MenuEntry } from "./menu-entry.ts";
import { choose, firstItem, onMenuKey, type Choosing } from "./menu-keys.ts";
import { renderEntry } from "./menu-item.view.ts";
import {
  isSubmenuOpen,
  isMoreOpen,
  onMoreClick,
  onSubmenuHover,
  renderSubmenu,
  renderSubmenuOf,
  type MenuContext,
} from "./menu-submenu.ts";

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
  // A list opened from a control inside another overlay.
  readonly isChild?: boolean;
  // A submenu sits beside the row that opened it, not under it; an editor
  // of a cell lies over the cell, at least as wide.
  readonly placement?: "beside" | "over";
  // The open overlay, for menus whose rows open submenus.
  readonly context?: MenuContext;
}

// The point is set through the CSSOM: it changes with every opening.
function placeAt(point: MenuOptions["point"]) {
  return (element: Element | undefined): void => {
    if (!(element instanceof HTMLElement) || point === undefined) return;
    element.style.setProperty("--menu-x", `${String(point.x)}px`);
    element.style.setProperty("--menu-y", `${String(point.y)}px`);
  };
}

function renderHeader(
  options: MenuOptions,
  close: () => void,
): TemplateResult | typeof nothing {
  if (options.title === undefined) return nothing;
  const { onBack } = options;
  return html`<div class="menu__header">
    ${
      onBack === undefined
        ? nothing
        : html`<button
            type="button"
            class="menu__back"
            aria-label=${COPY.menu.back}
            @click=${onBack}
          >
            ${renderIcon("arrow-left")}
          </button>`
    }
    <span class="menu__title">${options.title}</span>
    <button
      type="button"
      class="menu__close"
      aria-label=${COPY.menu.close}
      @click=${close}
    >
      ${renderIcon("close")}
    </button>
  </div>`;
}

function renderSearch(search: MenuSearch | undefined) {
  if (search === undefined) return nothing;
  return html`<label class="menu__search">
    <input
      type="text"
      aria-label=${search.placeholder}
      placeholder=${search.placeholder}
      autocomplete="off"
      data-autofocus
      ${ref(focusOnce)}
      .value=${search.query}
      @input=${(event: Event) => {
        if (event.target instanceof HTMLInputElement)
          search.onQuery(event.target.value);
      }}
    />
  </label>`;
}

function renderRows(entries: readonly MenuEntry[], options: MenuOptions) {
  const isListbox = options.role === "listbox";
  const first = options.search === undefined ? firstItem(entries) : undefined;
  // An empty search result says so; a panel without rows shows none.
  const isSearching = (options.search?.query.trim() ?? "") !== "";
  if (entries.length === 0) {
    return isSearching
      ? html`<p class="menu__empty">${COPY.menu.noMatches}</p>`
      : nothing;
  }
  const { context } = options;
  // An open submenu is drawn right after its row, which anchors it.
  return entries.map((entry, index) => {
    const isExpanded = isMenuItem(entry) && isSubmenuOpen(entry, context);
    const isMoreExpanded = isMenuItem(entry) && isMoreOpen(entry, context);
    const moreMenu =
      isMoreExpanded && isMenuItem(entry)
        ? renderSubmenuOf(entry.more, context, renderMenu)
        : nothing;
    const place = {
      index,
      isListbox,
      isFirst: entry === first,
      isExpanded,
      isMoreExpanded,
      moreMenu,
    };
    return html`${renderEntry(entry, place)}${
      isExpanded && isMenuItem(entry)
        ? renderSubmenu(entry, context, renderMenu)
        : nothing
    }`;
  });
}

// The rows sit in a list of their own, which carries the menu's role and
// name, so that its header, search field and footer are not read as items.
function renderList(entries: readonly MenuEntry[], options: MenuOptions) {
  if (entries.length === 0) return renderRows(entries, options);
  return html`<div
    class="menu__list"
    role=${options.role ?? "menu"}
    aria-label=${options.label}
  >
    ${renderRows(entries, options)}
  </div>`;
}

// How the menu closes: alone, or after a choice that closes the overlay.
function choosingOf(
  options: MenuOptions,
  items: readonly MenuEntry[],
): Choosing {
  const { onDone } = options;
  const close = (): void => {
    focusOverlayAnchor();
    options.onClose();
  };
  const done =
    onDone === undefined
      ? close
      : (): void => {
          focusOverlayAnchor({ isWhole: true });
          onDone();
        };
  return { items, close, done, context: options.context };
}

function onRowClick(event: Event, choosing: Choosing): void {
  if (!(event.target instanceof Element)) return;
  if (onMoreClick(event, choosing.items, choosing.context)) return;
  const row = event.target.closest<HTMLElement>("[data-index]");
  if (row === null) return;
  // A press inside a list open in this menu belongs to that list.
  if (row.closest(".menu") !== event.currentTarget) return;
  event.stopPropagation();
  choose(choosing.items[Number(row.dataset.index ?? -1)], choosing, row);
}

export function renderMenu(options: MenuOptions): TemplateResult {
  const items = visibleEntries(options.items, options.search?.query ?? "");
  const choosing = choosingOf(options, items);
  const isSubmenu = options.placement === "beside";
  return html`<div
    class="menu"
    popover="manual"
    data-overlay
    ?data-at-point=${options.point !== undefined}
    ?data-child=${options.isChild === true}
    data-placement=${options.placement ?? nothing}
    data-size=${isSubmenu && options.lead === undefined ? "narrow" : nothing}
    ${ref(placeAt(options.point))}
    ${ref(showPopoverWhenConnected)}
    @click=${(event: Event) => {
      onRowClick(event, choosing);
    }}
    @pointerover=${(event: PointerEvent) => {
      onSubmenuHover(event, items, options.context);
    }}
    @keydown=${(event: KeyboardEvent) => {
      onMenuKey(event, choosing, isSubmenu);
    }}
  >
    ${renderHeader(options, choosing.close)} ${renderSearch(options.search)}
    ${options.lead ?? nothing} ${renderList(items, options)}
    ${
      options.footer === undefined
        ? nothing
        : html`<p class="menu__footer" role="none">${options.footer}</p>`
    }
  </div>`;
}
