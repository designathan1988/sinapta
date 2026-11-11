// The options of a select, multi-select or status property, as Notion
// lists them in the property's menu: each a chip whose row opens its own
// panel, with its name, its place, Delete and its color; and a field that
// adds one.
import { html, type TemplateResult } from "lit-html";
import type { PropertyDefinition } from "../../blocks/database/index.ts";
import { openOverlayPanel } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { MenuEntry } from "../../ui/menu/index.ts";
import {
  deleteOption,
  moveOption,
  recolorOption,
  renameOption,
  type OptionTarget,
} from "./option.commands.ts";
import type { TableContext } from "./table-cell.view.ts";
import { addOption, OPTION_COLORS } from "./table.commands.ts";

const TEXT = COPY.database;

// The panel of one option is the overlay's panel "option:<its id>".
const OPTION_PANEL = "option:";

export function optionOfPanel(panel: string | undefined): string | undefined {
  return panel?.startsWith(OPTION_PANEL) === true
    ? panel.slice(OPTION_PANEL.length)
    : undefined;
}

function colorLabel(color: string): string {
  const tones: Readonly<Record<string, string>> = COPY.tones;
  return tones[color] ?? color;
}

export function renderAddOption(
  property: PropertyDefinition,
  context: TableContext,
): TemplateResult {
  const databaseId = context.model.database.id;
  const onAdd = (event: KeyboardEvent): void => {
    if (event.key !== "Enter" || !(event.target instanceof HTMLInputElement)) {
      return;
    }
    const name = event.target.value;
    event.target.value = "";
    context.dispatch(
      addOption.create({ databaseId, propertyId: property.id, name }),
    );
  };
  return html`<label class="menu__field">
    <input
      type="text"
      aria-label=${TEXT.addOption}
      placeholder=${TEXT.addOption}
      @keydown=${onAdd}
    />
  </label>`;
}

// The options under their label, each row its chip and a chevron.
export function optionEntries(
  property: PropertyDefinition,
  context: TableContext,
): MenuEntry[] {
  const options = property.options ?? [];
  if (options.length === 0) return [];
  return [
    { kind: "section", label: TEXT.options },
    ...options.map((option): MenuEntry => ({
      label: option.name,
      // Notion's grip; its panel's Move up and down move it by keyboard.
      icon: "grip",
      color: option.color,
      opensPanel: true,
      onSelect: () =>
        context.dispatch(
          openOverlayPanel.create({ panel: `${OPTION_PANEL}${option.id}` }),
        ),
    })),
  ];
}

export interface OptionPanel {
  readonly title: string;
  readonly lead: TemplateResult;
  readonly items: readonly MenuEntry[];
}

function renderName(
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

// Moving an option is the keyboard's way to drag it; Delete goes back to
// the property's panel.
function placeItems(target: OptionTarget, context: TableContext): MenuEntry[] {
  const { dispatch } = context;
  const move = (offset: number) => (): void => {
    dispatch(moveOption.create({ ...target, offset }));
  };
  return [
    {
      label: TEXT.moveOptionUp,
      icon: "up",
      keepsOpen: true,
      onSelect: move(-1),
    },
    {
      label: TEXT.moveOptionDown,
      icon: "down",
      keepsOpen: true,
      onSelect: move(1),
    },
    {
      label: TEXT.deleteOption,
      icon: "trash",
      isDanger: true,
      keepsOpen: true,
      onSelect: () => {
        dispatch(deleteOption.create(target));
        dispatch(openOverlayPanel.create({ panel: null }));
      },
    },
  ];
}

export function optionPanel(
  property: PropertyDefinition,
  optionId: string,
  context: TableContext,
): OptionPanel | undefined {
  const option = property.options?.find((item) => item.id === optionId);
  if (option === undefined) return undefined;
  const databaseId = context.model.database.id;
  const target = { databaseId, propertyId: property.id, optionId };
  const colors = OPTION_COLORS.map((color): MenuEntry => ({
    label: colorLabel(color),
    color,
    check: "radio",
    isChecked: option.color === color,
    keepsOpen: true,
    onSelect: () =>
      context.dispatch(recolorOption.create({ ...target, color })),
  }));
  return {
    title: option.name,
    lead: renderName(target, option.name, context),
    items: [
      ...placeItems(target, context),
      { kind: "divider" },
      { kind: "section", label: TEXT.optionColor },
      ...colors,
    ],
  };
}
