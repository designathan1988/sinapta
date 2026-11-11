// One entry of a menu: a section label, a line, or an item with its
// icon, label or chip, description, value, and its check, switch or
// chevron at the end.
import { html, nothing, type TemplateResult } from "lit-html";
import { renderChip } from "../chip/index.ts";
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

function renderText(item: MenuItem): TemplateResult {
  const label =
    item.color === undefined ? item.label : renderChip(item.label, item.color);
  return html`<span class="menu__text">
    <span class="menu__label">${label}</span>
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
  if (entry.kind === "divider") {
    return html`<hr class="menu__divider" role="separator" />`;
  }
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
    aria-haspopup=${entry.submenu === undefined ? nothing : "menu"}
    aria-expanded=${entry.submenu === undefined ? nothing : String(place.isExpanded === true)}
    ?data-overlay-child-anchor=${entry.submenu !== undefined}
    ?data-autofocus=${place.isFirst}
    ?data-danger=${entry.isDanger === true}
    ?disabled=${entry.isDisabled === true}
  >
    ${entry.icon === undefined ? nothing : renderIcon(entry.icon)}
    ${renderText(entry)}
    ${
      entry.value === undefined
        ? nothing
        : html`<span class="menu__value">${entry.value}</span>`
    }
    ${renderEnd(entry)}
  </button>`;
}
