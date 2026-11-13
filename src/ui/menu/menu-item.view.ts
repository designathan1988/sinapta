// One entry of a menu: a section label, a line, or an item with its
// icon, label or chip, description, value, and its check, switch or
// chevron at the end.
import "./menu-more.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { renderChip, renderChipSwatch } from "../chip/index.ts";
import { COPY } from "../copy.ts";
import { renderIcon } from "../icon/index.ts";
import { renderSwitchMark } from "../switch/index.ts";
import type { MenuEntry, MenuItem } from "./menu-entry.ts";

const ROLES = {
  radio: "menuitemradio",
  box: "menuitemcheckbox",
  switch: "menuitemcheckbox",
} as const;

function roleOf(item: MenuItem, isListbox: boolean): string {
  if (isListbox) return "option";
  return item.check === undefined ? "menuitem" : ROLES[item.check];
}

function renderEnd(item: MenuItem): TemplateResult | typeof nothing {
  const isChecked = item.isChecked === true;
  if (item.endIcon !== undefined) return renderIcon(item.endIcon);
  if (item.check === "switch") return renderSwitchMark(isChecked);
  if (item.opensPanel === true || item.submenu !== undefined) {
    return renderIcon("chevron");
  }
  return isChecked ? renderIcon("check") : nothing;
}

// What leads the row: a color's swatch or an icon.
function renderLead(item: MenuItem): TemplateResult | typeof nothing {
  if (item.swatch !== undefined) return renderChipSwatch(item.swatch);
  return item.icon === undefined ? nothing : renderIcon(item.icon);
}

function renderText(item: MenuItem): TemplateResult {
  const label =
    item.color === undefined ? item.label : renderChip(item.label, item.color);
  const prefix =
    item.prefix === undefined
      ? nothing
      : html`<span class="menu__prefix">${item.prefix}</span>`;
  return html`<span class="menu__text">
    <span class="menu__label">${prefix}${label}</span>
    ${
      item.description === undefined
        ? nothing
        : html`<span class="menu__description">${item.description}</span>`
    }
  </span>`;
}

export interface EntryPlace {
  readonly index: number;
  readonly isListbox: boolean;
  // The item that takes focus when the menu opens.
  readonly isFirst: boolean;
  // Whether the item's submenu is open beside the menu.
  readonly isExpanded?: boolean;
  // Whether the item's actions are open, and their menu when they are.
  readonly isMoreExpanded?: boolean;
  readonly moreMenu?: unknown;
}

// A row with its own actions: the row, then its "…" and their menu.
function renderWithMore(
  row: TemplateResult,
  place: EntryPlace,
): TemplateResult {
  return html`<div class="menu__row" role="none">
    ${row}
    <button
      type="button"
      class="menu__more"
      role="menuitem"
      tabindex="-1"
      data-more=${place.index}
      aria-label=${COPY.menu.more}
      aria-haspopup="menu"
      aria-expanded=${String(place.isMoreExpanded === true)}
      data-overlay-child-anchor
    >
      ${renderIcon("more")}
    </button>
    ${place.moreMenu ?? nothing}
  </div>`;
}

export function renderEntry(
  entry: MenuEntry,
  place: EntryPlace,
): TemplateResult {
  if (entry.kind === "section") {
    return html`<p class="menu__section" role="presentation">
      ${entry.label}
    </p>`;
  }
  if (entry.kind === "note") {
    return html`<p class="menu__note">${entry.label}</p>`;
  }
  if (entry.kind === "divider") {
    return html`<hr class="menu__divider" role="separator" />`;
  }
  const row = renderItem(entry, place);
  return entry.more === undefined ? row : renderWithMore(row, place);
}

function renderItem(entry: MenuItem, place: EntryPlace): TemplateResult {
  const role = roleOf(entry, place.isListbox);
  const isChecked = String(entry.isChecked === true);
  return html`<button
    type="button"
    class="menu__item"
    role=${role}
    tabindex="-1"
    data-index=${place.index}
    aria-checked=${role.startsWith("menuitem") && entry.check !== undefined ? isChecked : nothing}
    aria-selected=${role === "option" ? isChecked : nothing}
    aria-haspopup=${entry.submenu === undefined ? (entry.opens ?? nothing) : "menu"}
    aria-expanded=${entry.submenu === undefined ? nothing : String(place.isExpanded === true)}
    ?data-overlay-child-anchor=${entry.submenu !== undefined}
    ?data-autofocus=${place.isFirst}
    ?data-danger=${entry.isDanger === true}
    ?disabled=${entry.isDisabled === true}
  >
    ${renderLead(entry)} ${renderText(entry)}
    ${
      entry.value === undefined
        ? nothing
        : html`<span class="menu__value">${entry.value}</span>`
    }
    ${
      entry.shortcut === undefined
        ? nothing
        : html`<kbd class="menu__shortcut">${entry.shortcut}</kbd>`
    }
    ${renderEnd(entry)}
  </button>`;
}
