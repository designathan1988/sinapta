// The options of a select, multi-select or status property, as Notion
// lists them in "Edit property": each a chip whose row opens its own
// submenu, with its name, its place, Delete and its color; and a field
// that adds one.
import { html, type TemplateResult } from "lit-html";
import type { PropertyDefinition } from "../../blocks/database/index.ts";
import { closeChildOverlay } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { MenuEntry, SubmenuContent } from "../../ui/menu/index.ts";
import { optionColorItems, renderOptionName } from "./option-menu-parts.ts";
import {
  deleteOption,
  moveOption,
  type OptionTarget,
} from "./option.commands.ts";
import type { TableContext } from "./table-cell.view.ts";
import { addOption } from "./table.commands.ts";

const TEXT = COPY.database;

// An option's submenu opens from "Edit property", the column menu's
// first submenu, so it is the second one open.
const OPTION_DEPTH = 1;

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
      // Notion's grip; its submenu's Move up and down move it by keyboard.
      icon: "grip",
      color: option.color,
      submenu: {
        id: `${property.id}:option:${option.id}`,
        menu: () => optionMenu(property, option.id, context),
      },
    })),
  ];
}

// Moving an option is the keyboard's way to drag it; Delete closes its
// submenu and leaves the property's.
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
        dispatch(closeChildOverlay.create({ depth: OPTION_DEPTH }));
      },
    },
  ];
}

export function optionMenu(
  property: PropertyDefinition,
  optionId: string,
  context: TableContext,
): SubmenuContent {
  const option = property.options?.find((item) => item.id === optionId);
  if (option === undefined) return { label: TEXT.options, items: [] };
  const databaseId = context.model.database.id;
  const target = { databaseId, propertyId: property.id, optionId };
  return {
    label: option.name,
    lead: renderOptionName(target, option.name, context),
    items: [
      ...placeItems(target, context),
      { kind: "divider" },
      ...optionColorItems(target, option.color, context),
    ],
  };
}
