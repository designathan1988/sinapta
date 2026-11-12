// The editor of a select, multi-select or status cell, as Notion's: laid
// over the cell, the chosen options as chips beside a search field at its
// top, "Select an option or create one", then the options, a status's
// under its three groups, each with "…" for its name, place and color,
// and "Create" for what is typed when no option has that name.
import "./cell-options.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import type {
  PropertyDefinition,
  SelectOption,
} from "../../blocks/database/index.ts";
import { parseBlockId, type BlockId } from "../../model/index.ts";
import { closeOverlay, setOverlayQuery } from "../../state/index.ts";
import { renderRemovableChip } from "../../ui/chip/index.ts";
import { COPY } from "../../ui/copy.ts";
import { focusOnce } from "../../ui/focus/index.ts";
import {
  renderMenu,
  type MenuEntry,
  type MenuItem,
} from "../../ui/menu/index.ts";
import { optionMenu } from "./option-list.view.ts";
import { STATUS_GROUP_IDS, statusGroupOf } from "./properties/status/index.ts";
import { setRowValue } from "./row.commands.ts";
import type { TableContext } from "./table-cell.view.ts";
import { addOption, OPTION_COLORS } from "./table.commands.ts";

const TEXT = COPY.database;
const MULTI_SELECT = "multi-select";

interface OpenCell {
  readonly rowId: BlockId;
  readonly property: PropertyDefinition;
  // Ids of the options the cell holds.
  readonly selected: readonly string[];
}

function selectedIds(stored: unknown): string[] {
  if (Array.isArray(stored))
    return stored.filter((id) => typeof id === "string");
  return typeof stored === "string" ? [stored] : [];
}

// The cell the editor belongs to, from the overlay's "row:property" id.
function openCell(context: TableContext): OpenCell | undefined {
  const { model, state } = context;
  const anchor = state.ui.overlay?.anchorId ?? "";
  const [row = "", propertyKey = ""] = anchor.split(":");
  const rowId = parseBlockId(row);
  const property = model.database.props.properties.find(
    (item) => item.id === propertyKey,
  );
  if (rowId === undefined || property === undefined) return undefined;
  const values = model.rows.find((item) => item.id === rowId)?.values;
  return { rowId, property, selected: selectedIds(values?.[property.id]) };
}

// What the cell holds after an option is chosen: a select takes or drops
// the one option, a multi-select adds or removes it.
function valueAfter(cell: OpenCell, optionId: string): unknown {
  const isChosen = cell.selected.includes(optionId);
  if (cell.property.type !== MULTI_SELECT)
    return isChosen ? undefined : optionId;
  const ids = isChosen
    ? cell.selected.filter((id) => id !== optionId)
    : [...cell.selected, optionId];
  return ids.length === 0 ? undefined : ids;
}

function setValue(cell: OpenCell, optionId: string, context: TableContext) {
  const { rowId, property } = cell;
  const value = valueAfter(cell, optionId);
  context.dispatch(
    setRowValue.create({ rowId, propertyId: property.id, value }),
  );
}

// Backspace in the empty field takes off the last chosen option.
function onFieldKey(
  event: KeyboardEvent,
  cell: OpenCell,
  context: TableContext,
) {
  const isEmpty =
    event.target instanceof HTMLInputElement && event.target.value === "";
  const last = cell.selected.at(-1);
  if (event.key !== "Backspace" || !isEmpty || last === undefined) return;
  event.preventDefault();
  setValue(cell, last, context);
}

function renderField(
  cell: OpenCell,
  query: string,
  context: TableContext,
): TemplateResult {
  const options = cell.property.options ?? [];
  const chosen = cell.selected.flatMap((id) => {
    const option = options.find((item) => item.id === id);
    return option === undefined ? [] : [option];
  });
  return html`<div class="menu__search database__option-field">
    ${chosen.map((option) =>
      renderRemovableChip(option.name, option.color, {
        label: TEXT.optionRemove(option.name),
        onRemove: () => {
          setValue(cell, option.id, context);
        },
      }),
    )}
    <input
      type="text"
      autocomplete="off"
      aria-label=${TEXT.optionSearch}
      placeholder=${TEXT.optionSearch}
      data-autofocus
      ${ref(focusOnce)}
      .value=${query}
      @input=${(event: Event) => {
        if (event.target instanceof HTMLInputElement)
          context.dispatch(
            setOverlayQuery.create({ query: event.target.value }),
          );
      }}
      @keydown=${(event: KeyboardEvent) => {
        onFieldKey(event, cell, context);
      }}
    />
  </div>`;
}

function optionItem(
  option: SelectOption,
  cell: OpenCell,
  context: TableContext,
): MenuItem {
  return {
    label: option.name,
    color: option.color,
    icon: "grip",
    keepsOpen: cell.property.type === MULTI_SELECT,
    onSelect: () => {
      setValue(cell, option.id, context);
      context.dispatch(setOverlayQuery.create({ query: "" }));
    },
    more: {
      id: `${cell.property.id}:option:${option.id}`,
      menu: () => optionMenu(cell.property, option.id, context),
    },
  };
}

// The options that match what is typed; a status's under its groups.
function optionEntries(
  cell: OpenCell,
  query: string,
  context: TableContext,
): MenuEntry[] {
  const needle = query.trim().toLowerCase();
  const matching = (cell.property.options ?? []).filter((option) =>
    option.name.toLowerCase().includes(needle),
  );
  if (cell.property.type !== "status") {
    return matching.map((option) => optionItem(option, cell, context));
  }
  return STATUS_GROUP_IDS.flatMap((groupId): MenuEntry[] => {
    const inGroup = matching.filter(
      (option) => statusGroupOf(cell.property, option.id) === groupId,
    );
    return [
      { kind: "section", label: TEXT.statusGroups[groupId] },
      ...inGroup.map((option) => optionItem(option, cell, context)),
    ];
  });
}

// "Create", with the typed name as the new option's chip, while no option
// has that name.
function createEntries(
  cell: OpenCell,
  query: string,
  context: TableContext,
): MenuEntry[] {
  const name = query.trim();
  const options = cell.property.options ?? [];
  const taken = options.some(
    (option) => option.name.toLowerCase() === name.toLowerCase(),
  );
  if (name === "" || taken) return [];
  const color = OPTION_COLORS[options.length % OPTION_COLORS.length] ?? "gray";
  const { model, dispatch } = context;
  const payload = {
    databaseId: model.database.id,
    propertyId: cell.property.id,
    name,
    rowId: cell.rowId,
  };
  return [
    {
      prefix: TEXT.optionCreate,
      label: name,
      color,
      keepsOpen: cell.property.type === MULTI_SELECT,
      onSelect: () => {
        dispatch(addOption.create(payload));
        dispatch(setOverlayQuery.create({ query: "" }));
      },
    },
  ];
}

export function renderCellOptions(
  context: TableContext,
): TemplateResult | typeof nothing {
  const cell = openCell(context);
  if (cell === undefined) return nothing;
  const { overlay } = context.state.ui;
  const query = overlay?.query ?? "";
  return renderMenu({
    label: cell.property.name,
    placement: "over",
    lead: renderField(cell, query, context),
    items: [
      { kind: "section", label: TEXT.optionHint },
      ...optionEntries(cell, query, context),
      ...createEntries(cell, query, context),
    ],
    context: { overlay, dispatch: context.dispatch },
    onClose: () => context.dispatch(closeOverlay.create({})),
  });
}
