// The choices of a select or multi-select cell, with a field to add one.
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import type {
  PropertyDefinition,
  SelectOption,
} from "../../blocks/database/index.ts";
import { parseBlockId, type BlockId } from "../../model/index.ts";
import { closeOverlay } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { showPopoverWhenConnected } from "../../ui/overlay/index.ts";
import { setRowValue } from "./row.commands.ts";
import type { TableContext } from "./table-cell.view.ts";
import { addOption } from "./table.commands.ts";

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

// The cell the popover belongs to, from the overlay's "row:property" id.
function openCell(context: TableContext): OpenCell | undefined {
  const { model, state } = context;
  const [row = "", propertyKey = ""] = (state.ui.overlay?.anchorId ?? "").split(
    ":",
  );
  const rowId = parseBlockId(row);
  const property = model.database.props.properties.find(
    (item) => item.id === propertyKey,
  );
  if (rowId === undefined || property === undefined) return undefined;
  const values = model.rows.find((item) => item.id === rowId)?.values;
  return { rowId, property, selected: selectedIds(values?.[property.id]) };
}

// What the cell holds after an option is pressed: a select takes or drops
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

function renderOption(
  option: SelectOption,
  isSelected: boolean,
): TemplateResult {
  return html`<button
    type="button"
    class="database__option"
    role="option"
    data-option-id=${option.id}
    aria-selected=${String(isSelected)}
  >
    <span class="database__chip" data-color=${option.color}
      >${option.name}</span
    >
  </button>`;
}

function onOptionClick(
  event: Event,
  cell: OpenCell,
  context: TableContext,
): void {
  const target = event.target instanceof Element ? event.target : null;
  const optionId =
    target?.closest<HTMLElement>("[data-option-id]")?.dataset.optionId;
  if (optionId === undefined) return;
  const { rowId, property } = cell;
  const value = valueAfter(cell, optionId);
  context.dispatch(
    setRowValue.create({ rowId, propertyId: property.id, value }),
  );
  if (property.type !== MULTI_SELECT) context.dispatch(closeOverlay.create({}));
}

// Enter in the field adds what was typed as a new option.
function onFieldKey(
  event: KeyboardEvent,
  cell: OpenCell,
  context: TableContext,
): void {
  const { dispatch, model } = context;
  if (event.key === "Escape") dispatch(closeOverlay.create({}));
  if (event.key !== "Enter" || !(event.target instanceof HTMLInputElement))
    return;
  const name = event.target.value;
  event.target.value = "";
  const propertyId = cell.property.id;
  dispatch(
    addOption.create({ databaseId: model.database.id, propertyId, name }),
  );
}

export function renderCellOptions(
  context: TableContext,
): TemplateResult | typeof nothing {
  const cell = openCell(context);
  if (cell === undefined) return nothing;
  const options = cell.property.options ?? [];
  return html`<div
    class="database__popover"
    popover="manual"
    data-overlay
    ${ref(showPopoverWhenConnected)}
    @click=${(event: Event) => {
      onOptionClick(event, cell, context);
    }}
    @keydown=${(event: KeyboardEvent) => {
      onFieldKey(event, cell, context);
    }}
  >
    <div role="listbox" aria-label=${COPY.database.options}>
      ${options.map((option) => renderOption(option, cell.selected.includes(option.id)))}
    </div>
    <input
      class="database__field"
      type="text"
      data-autofocus
      aria-label=${COPY.database.addOption}
      placeholder=${COPY.database.addOption}
    />
  </div>`;
}
