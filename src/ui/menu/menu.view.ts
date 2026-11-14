// A menu in the top layer, drawn as Notion draws its menus: an optional
// header with a back and a close button, an optional search field, then
// rows, labels and lines; a listbox chooses one value. Rendered while open.
import "./menu.css";
import "./menu-field.css";
import "./menu-inset.css";
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
} from "./menu-submenu.ts";
import { afterRender } from "../focus/index.ts";
import { keepKeys } from "./menu-keep-keys.ts";
import type { MenuOptions, MenuSearch } from "./menu-options.ts";
import { menuPointPlace, type Point } from "./menu-point.ts";

export type { MenuOptions, MenuSearch } from "./menu-options.ts";

function setPoint(element: HTMLElement, point: Point): void {
  element.style.setProperty("--menu-x", `${String(point.x)}px`);
  element.style.setProperty("--menu-y", `${String(point.y)}px`);
}

// The point is set through the CSSOM: it changes with every opening. Once
// the menu is open it is measured and moved to fit in the window.
function placeAt(point: MenuOptions["point"]) {
  return (element: Element | undefined): void => {
    if (!(element instanceof HTMLElement) || point === undefined) return;
    setPoint(element, point);
    const fit = (): void => {
      const { width, height } = element.getBoundingClientRect();
      if (!element.isConnected || height === 0) return;
      const room = { width: window.innerWidth, height: window.innerHeight };
      setPoint(element, menuPointPlace(point, { width, height }, room));
    };
    // Measured once it is open: when the popover shows, or after this
    // render when it already shows.
    if (element.matches(":popover-open")) afterRender(fit);
    else element.addEventListener("toggle", fit, { once: true });
  };
}

function renderHeader(
  options: MenuOptions,
  close: () => void,
): TemplateResult | typeof nothing {
  if (options.title === undefined) return nothing;
  const { onBack } = options;
  return html`<div
    class="menu__header"
    ${ref((header) => {
      keepKeys(header);
    })}
  >
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
  // A submenu gives the focus back to its row; a menu, to what opened it,
  // even while one of its submenus is open.
  const isWhole = options.placement !== "beside";
  const close = (): void => {
    focusOverlayAnchor({ isWhole });
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

function isNarrowMenu(options: MenuOptions): boolean {
  if (options.isNarrow === true) return true;
  const isSubmenu = options.placement === "beside";
  return isSubmenu && options.lead === undefined && options.isWide !== true;
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
    ?data-short=${options.isShort === true}
    ?data-inset=${options.isInset === true}
    data-placement=${options.placement ?? nothing}
    data-size=${isNarrowMenu(options) ? "narrow" : nothing}
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
    ${options.tail ?? nothing}
    ${
      options.footer === undefined
        ? nothing
        : html`<p class="menu__footer" role="none">${options.footer}</p>`
    }
  </div>`;
}
