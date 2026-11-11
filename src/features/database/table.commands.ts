// Interface state of the table: the cell that has focus and how far a long
// table is scrolled. None of it is workspace data.
import {
  selectDatabase,
  type SelectOption,
} from "../../blocks/database/index.ts";
import type { BlockId, PropertyId } from "../../model/index.ts";
import { defineCommand, type ActiveCell } from "../../state/index.ts";

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
    return {
      operations: [
        {
          type: "record.update",
          kind: "block",
          id: database.id,
          patch: { props },
        },
      ],
    };
  },
});

export const tableCommands = [setActiveCell, setTableFirstRow, addOption];
