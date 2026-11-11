// What every menu of one option shows, as Notion's option and group
// menus do: its name in a field, and its colors as swatches with the
// current one checked.
import { html, type TemplateResult } from "lit-html";
import { TONES } from "../../model/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { MenuEntry } from "../../ui/menu/index.ts";
import {
  recolorOption,
  renameOption,
  type OptionTarget,
} from "./option.commands.ts";
import type { TableContext } from "./table-cell.view.ts";

const TEXT = COPY.database;

function colorLabel(color: string): string {
  const tones: Readonly<Record<string, string>> = COPY.tones;
  return tones[color] ?? color;
}

export function renderOptionName(
  target: OptionTarget,
  name: string,
  context: TableContext,
): TemplateResult {
  const rename = (event: Event): void => {
    if (!(event.target instanceof HTMLInputElement)) return;
    const next = event.target.value;
    context.dispatch(renameOption.create({ ...target, name: next }));
  };
  return html`<label class="menu__field">
    <input
      type="text"
      aria-label=${TEXT.optionName}
      data-autofocus
      .value=${name}
      @change=${rename}
    />
  </label>`;
}

// An option's colors as Notion lists them: Default, then the palette in
// its own order.
const OPTION_COLOR_CHOICES = ["default", ...TONES];

export function optionColorItems(
  target: OptionTarget,
  current: string,
  context: TableContext,
): MenuEntry[] {
  return [
    { kind: "section", label: TEXT.optionColor },
    ...OPTION_COLOR_CHOICES.map((color): MenuEntry => ({
      label: colorLabel(color),
      swatch: color,
      check: "radio",
      isChecked: current === color,
      keepsOpen: true,
      onSelect: () =>
        context.dispatch(recolorOption.create({ ...target, color })),
    })),
  ];
}
