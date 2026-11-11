// The name at the top of a menu, as Notion's column and view menus show
// it: an icon in a small box, then a field that renames on change, ready
// to type in when the menu opens.
import { html, type TemplateResult } from "lit-html";
import { renderIcon, type IconName } from "../icon/index.ts";

export interface MenuName {
  readonly icon: IconName;
  // Names the field for assistive tools.
  readonly label: string;
  readonly value: string;
  // The new name, trimmed; an empty one puts the old name back.
  readonly onRename: (name: string) => void;
}

export function renderMenuName(name: MenuName): TemplateResult {
  const onChange = (event: Event): void => {
    if (!(event.target instanceof HTMLInputElement)) return;
    const next = event.target.value.trim();
    if (next === "") event.target.value = name.value;
    else name.onRename(next);
  };
  return html`<div class="menu__name">
    <span class="menu__name-icon" aria-hidden="true"
      >${renderIcon(name.icon)}</span
    >
    <label class="menu__field">
      <input
        type="text"
        aria-label=${name.label}
        data-autofocus
        .value=${name.value}
        @change=${onChange}
      />
    </label>
  </div>`;
}
