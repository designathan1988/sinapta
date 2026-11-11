import "./menu.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { renderIcon, type IconName } from "../icon/index.ts";
import {
  focusOverlayAnchor,
  showPopoverWhenConnected,
} from "../overlay/index.ts";

export interface MenuItem {
  readonly label: string;
  readonly onSelect: () => void;
  readonly icon?: IconName;
  readonly isDanger?: boolean;
  readonly isDisabled?: boolean;
  // An option of a group ("radio") or one that turns on and off ("box").
  readonly check?: "radio" | "box";
  readonly isChecked?: boolean;
}

const ROLES = {
  radio: "menuitemradio",
  box: "menuitemcheckbox",
} as const;

const ITEMS = "[role^=menuitem]:not(:disabled)";

export interface MenuOptions {
  readonly label: string;
  readonly items: readonly MenuItem[];
  // Called when the menu should close: after a choice, Escape or Tab.
  readonly onClose: () => void;
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

function renderItem(item: MenuItem, index: number): TemplateResult {
  const { check } = item;
  const isChecked = item.isChecked === true;
  return html`<button
    type="button"
    class="menu__item"
    role=${check === undefined ? "menuitem" : ROLES[check]}
    tabindex="-1"
    data-index=${index}
    aria-checked=${check === undefined ? nothing : String(isChecked)}
    ?data-autofocus=${index === 0}
    ?data-danger=${item.isDanger === true}
    ?disabled=${item.isDisabled === true}
  >
    ${item.icon === undefined ? nothing : renderIcon(item.icon)}
    <span class="menu__label">${item.label}</span>
    ${isChecked ? renderIcon("check") : nothing}
  </button>`;
}

// A flat menu in the top layer. It is rendered only while it is open.
export function renderMenu(options: MenuOptions): TemplateResult {
  const close = (): void => {
    focusOverlayAnchor();
    options.onClose();
  };
  const onClick = (event: Event): void => {
    if (!(event.target instanceof Element)) return;
    const index =
      event.target.closest<HTMLElement>("[data-index]")?.dataset.index;
    const item = options.items[Number(index ?? -1)];
    if (item === undefined) return;
    close();
    item.onSelect();
  };
  const onKeyDown = (event: KeyboardEvent): void => {
    if (!(event.currentTarget instanceof Element)) return;
    if (event.key === "Escape" || event.key === "Tab") close();
    else if (!moveFocus(event.currentTarget, event.key)) return;
    event.preventDefault();
  };
  return html`<div
    class="menu"
    role="menu"
    popover="manual"
    data-overlay
    aria-label=${options.label}
    ${ref(showPopoverWhenConnected)}
    @click=${onClick}
    @keydown=${onKeyDown}
  >
    ${options.items.map(renderItem)}
  </div>`;
}
