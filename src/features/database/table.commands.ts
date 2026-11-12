// Interface state of the table: the cell that has focus and how far a long
// table is scrolled. None of it is workspace data.
import {
  selectDatabase,
  type SelectOption,
} from "../../blocks/database/index.ts";
import type { BlockId, Operation, PropertyId } from "../../model/index.ts";
import {
  defineCommand,
  type ActiveCell,
  type AppState,
} from "../../state/index.ts";
import { rowValueUpdate, selectRow } from "./row.commands.ts";

function isSameCell(a: ActiveCell | null, b: ActiveCell | null): boolean {
  if (a === null || b === null) return a === b;
  return (
    a.rowId === b.rowId &&
    a.propertyId === b.propertyId &&
    a.isEditing === b.isEditing
  );
}

export const setActiveCell = defineCommand<{ cell: ActiveCell | null }>({
  type: "ui.setActiveCell",
  handle(state, command) {
    if (isSameCell(state.ui.activeCell, command.cell)) return {};
    return { ui: { ...state.ui, activeCell: command.cell } };
  },
});

export const setTableFirstRow = defineCommand<{ firstRow: number }>({
  type: "ui.setTableFirstRow",
  handle(state, command) {
    const tableFirstRow = Math.max(0, Math.floor(command.firstRow));
    if (tableFirstRow === state.ui.tableFirstRow) return {};
    return { ui: { ...state.ui, tableFirstRow } };
  },
});

// The chip colors an option can take, in the order new options take them.
export const OPTION_COLORS = [
  "blue",
  "green",
  "yellow",
  "orange",
  "red",
  "purple",
  "pink",
  "brown",
  "gray",
];

export interface AddOptionPayload {
  readonly databaseId: BlockId;
  readonly propertyId: PropertyId;
  readonly name: string;
  // The row whose cell takes the new option, as Notion's "Create" in a
  // cell's editor does: a multi-select adds it, the others become it.
  readonly rowId?: BlockId;
}

// The new option given to the row's cell, in the same step.
function choiceFor(
  state: AppState,
  command: AddOptionPayload & { readonly now: string },
  chosen: { readonly propertyType: string; readonly optionId: string },
): Operation[] {
  const row =
    command.rowId === undefined ? undefined : selectRow(state, command.rowId);
  if (row === undefined) return [];
  const current = row.props.values?.[command.propertyId];
  const kept = Array.isArray(current)
    ? current.filter((id): id is string => typeof id === "string")
    : [];
  const value =
    chosen.propertyType === "multi-select"
      ? [...kept, chosen.optionId]
      : chosen.optionId;
  const change = { propertyId: command.propertyId, value };
  return [rowValueUpdate(row, change, command.now)];
}

// Adds a choice to a select or multi-select property.
export const addOption = defineCommand<AddOptionPayload>({
  type: "property.addOption",
  newIds: { properties: 1 },
  handle(state, command) {
    const database = selectDatabase(state, command.databaseId);
    const id = command.meta.propertyIds[0];
    const name = command.name.trim();
    if (database === undefined || id === undefined || name === "") return {};
    const properties = database.props.properties.map((property) => {
      if (property.id !== command.propertyId) return property;
      const options = property.options ?? [];
      const color =
        OPTION_COLORS[options.length % OPTION_COLORS.length] ?? "gray";
      const option: SelectOption = { id, name, color };
      return { ...property, options: [...options, option] };
    });
    const props = { ...database.props, properties };
    const property = properties.find((item) => item.id === command.propertyId);
    const choice =
      property === undefined
        ? []
        : choiceFor(
            state,
            { ...command, now: command.meta.now },
            { propertyType: property.type, optionId: id },
          );
    return {
      operations: [
        {
          type: "record.update",
          kind: "block",
          id: database.id,
          patch: { props },
        },
        ...choice,
      ],
    };
  },
});

export const tableCommands = [setActiveCell, setTableFirstRow, addOption];
