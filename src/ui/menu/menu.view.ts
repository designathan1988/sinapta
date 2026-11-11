// A menu in the top layer, drawn as Notion draws its menus: an optional
// header with a back and a close button, an optional search field, then
// rows, labels and lines. A listbox is the same panel for choosing one
// value. It is rendered only while it is open.
import "./menu.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { COPY } from "../copy.ts";
import { renderIcon } from "../icon/index.ts";
import {
  focusOverlayAnchor,
  showPopoverWhenConnected,
} from "../overlay/index.ts";
import {
  isMenuItem,
  keepsMenuOpen,
  visibleEntries,
  type MenuEntry,
  type MenuItem,
} from "./menu-entry.ts";
import { renderEntry } from "./menu-item.view.ts";

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
}

const ITEMS = "[data-index]:not(:disabled)";

// The point is set through the CSSOM: it changes with every opening.
function placeAt(point: MenuOptions["point"]) {
  return (element: Element | undefined): void => {
    if (!(element instanceof HTMLElement) || point === undefined) return;
    element.style.setProperty("--menu-x", `${String(point.x)}px`);
    element.style.setProperty("--menu-y", `${String(point.y)}px`);
  };
}

function moveFocus(menu: Element, key: string): boolean {
  const items = [...menu.querySelectorAll<HTMLElement>(ITEMS)];
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
      .value=${search.query}
      @input=${(event: Event) => {
        if (event.target instanceof HTMLInputElement)
          search.onQuery(event.target.value);
      }}
    />
  </label>`;
}

interface Choosing {
  readonly items: readonly MenuEntry[];
  readonly close: () => void;
}

function choose(item: MenuEntry | undefined, choosing: Choosing): void {
  if (item === undefined || !isMenuItem(item) || item.isDisabled === true)
    return;
  if (!keepsMenuOpen(item)) choosing.close();
  item.onSelect();
}

function firstItem(entries: readonly MenuEntry[]): MenuItem | undefined {
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

function onMenuKey(event: KeyboardEvent, choosing: Choosing): void {
  const menu = event.currentTarget;
  if (!(menu instanceof Element)) return;
  if (event.key !== "Escape" && isOwnField(event.target)) return;
  const isSearch = event.target instanceof HTMLInputElement;
  if (event.key === "Escape" || event.key === "Tab") choosing.close();
  else if (event.key === "Enter" && isSearch) {
    choose(firstItem(choosing.items), choosing);
  } else if (!moveFocus(menu, event.key)) return;
  // A list open inside another overlay keeps its keys to itself.
  event.preventDefault();
  event.stopPropagation();
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
  return entries.map((entry, index) =>
    renderEntry(entry, { index, isListbox, isFirst: entry === first }),
  );
}

export function renderMenu(options: MenuOptions): TemplateResult {
  const items = visibleEntries(options.items, options.search?.query ?? "");
  const close = (): void => {
    focusOverlayAnchor();
    options.onClose();
  };
  const choosing = { items, close };
  const onClick = (event: Event): void => {
    if (!(event.target instanceof Element)) return;
    const row = event.target.closest<HTMLElement>("[data-index]");
    // A press inside a list open in this menu belongs to that list.
    if (row?.closest(".menu") !== event.currentTarget) return;
    event.stopPropagation();
    choose(items[Number(row.dataset.index ?? -1)], choosing);
  };
  return html`<div
    class="menu"
    role=${options.role ?? "menu"}
    popover="manual"
    data-overlay
    aria-label=${options.label}
    ?data-at-point=${options.point !== undefined}
    ?data-child=${options.isChild === true}
    ${ref(placeAt(options.point))}
    ${ref(showPopoverWhenConnected)}
    @click=${onClick}
    @keydown=${(event: KeyboardEvent) => {
      onMenuKey(event, choosing);
    }}
  >
    ${renderHeader(options, close)} ${renderSearch(options.search)}
    ${options.lead ?? nothing} ${renderRows(items, options)}
    ${
      options.footer === undefined
        ? nothing
        : html`<p class="menu__footer" role="none">${options.footer}</p>`
    }
  </div>`;
}
