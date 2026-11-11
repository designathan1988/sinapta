// Editing the choices of a select, multi-select or status property:
// renaming, recoloring, reordering and deleting them. Deleting a choice
// also clears it from every row that holds it, in the same step.
import {
  selectDatabase,
  type DatabaseBlock,
  type PropertyDefinition,
  type SelectOption,
} from "../../blocks/database/index.ts";
import { selectPage } from "../../blocks/page/index.ts";
import type { BlockId, Operation, PropertyId } from "../../model/index.ts";
import {
  defineCommand,
  type AppState,
  type CommandEffect,
} from "../../state/index.ts";

export interface OptionTarget {
  readonly databaseId: BlockId;
  readonly propertyId: PropertyId;
  readonly optionId: string;
}

type OptionsChange = (
  options: readonly SelectOption[],
  index: number,
) => readonly SelectOption[];

function updateDatabase(
  database: DatabaseBlock,
  properties: readonly PropertyDefinition[],
): Operation {
  const props = { ...database.props, properties: [...properties] };
  return {
    type: "record.update",
    kind: "block",
    id: database.id,
    patch: { props },
  };
}

// The database with the target property's options changed, or undefined
// when the database, the property or the option is missing.
function changedOptions(
  state: AppState,
  target: OptionTarget,
  change: OptionsChange,
): Operation | undefined {
  const database = selectDatabase(state, target.databaseId);
  const property = database?.props.properties.find(
    (item) => item.id === target.propertyId,
  );
  const options = property?.options ?? [];
  const index = options.findIndex((option) => option.id === target.optionId);
  if (database === undefined || index === -1) return undefined;
  const properties = database.props.properties.map((item) =>
    item.id === target.propertyId
      ? { ...item, options: [...change(options, index)] }
      : item,
  );
  return updateDatabase(database, properties);
}

function effectOf(operation: Operation | undefined): CommandEffect {
  return operation === undefined ? {} : { operations: [operation] };
}

function patchOption(patch: Partial<SelectOption>): OptionsChange {
  return (options, index) =>
    options.map((option, at) =>
      at === index ? { ...option, ...patch } : option,
    );
}

export const renameOption = defineCommand<OptionTarget & { name: string }>({
  type: "option.rename",
  handle(state, command) {
    const name = command.name.trim().normalize("NFC");
    if (name === "") return {};
    return effectOf(changedOptions(state, command, patchOption({ name })));
  },
});

export const recolorOption = defineCommand<OptionTarget & { color: string }>({
  type: "option.recolor",
  handle(state, command) {
    const { color } = command;
    return effectOf(changedOptions(state, command, patchOption({ color })));
  },
});

export const moveOption = defineCommand<OptionTarget & { offset: number }>({
  type: "option.move",
  handle(state, command) {
    const move: OptionsChange = (options, index) => {
      const to = index + Math.trunc(command.offset);
      const option = options[index];
      if (option === undefined || to < 0 || to >= options.length)
        return options;
      return options.toSpliced(index, 1).toSpliced(to, 0, option);
    };
    return effectOf(changedOptions(state, command, move));
  },
});

// A row's value without the option: a select's value is cleared, a
// multi-select keeps its other choices.
function valueWithout(value: unknown, optionId: string): unknown {
  if (value === optionId) return undefined;
  if (!Array.isArray(value) || !value.includes(optionId)) return value;
  return value.filter((id) => id !== optionId);
}

function clearedRows(state: AppState, target: OptionTarget): Operation[] {
  const database = selectDatabase(state, target.databaseId);
  return (database?.childIds ?? []).flatMap((rowId): Operation[] => {
    const row = selectPage(state, rowId);
    const values = row?.props.values;
    const value = values?.[target.propertyId];
    const next = valueWithout(value, target.optionId);
    if (row === undefined || values === undefined || next === value) return [];
    const { [target.propertyId]: _cleared, ...others } = values;
    const kept =
      next === undefined ? others : { ...others, [target.propertyId]: next };
    const props = { ...row.props, values: kept };
    return [
      { type: "record.update", kind: "block", id: row.id, patch: { props } },
    ];
  });
}

export const deleteOption = defineCommand<OptionTarget>({
  type: "option.delete",
  handle(state, command) {
    const remove: OptionsChange = (options, index) =>
      options.toSpliced(index, 1);
    const database = changedOptions(state, command, remove);
    if (database === undefined) return {};
    return { operations: [database, ...clearedRows(state, command)] };
  },
});

export const optionCommands = [
  renameOption,
  recolorOption,
  moveOption,
  deleteOption,
];
