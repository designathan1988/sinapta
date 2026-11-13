// A status is a select whose options sit in three groups: To-do, In
// progress and Complete. Rows filter by group, and boards group by status
// first.
import type { PropertyDefinition } from "../../../../blocks/database/index.ts";
import { COPY } from "../../../../ui/copy.ts";
import type {
  FilterOperator,
  PropertyType,
} from "../../property-definition.ts";
import { checkboxProperty } from "../checkbox/index.ts";
import { selectProperty } from "../select/index.ts";
import { isStatusChecked, showsAsCheckbox } from "./status-checkbox.ts";
import {
  readStatusConfig,
  STATUS_GROUP_IDS,
  statusConfigSchema,
  type StatusConfig,
  type StatusGroupId,
} from "./status.schema.ts";

const TEXT = COPY.database;

// The group an option is in; an option in no group counts as To-do.
export function statusGroupOf(
  property: PropertyDefinition,
  optionId: string,
): StatusGroupId {
  const groups = readStatusConfig(property.config)?.groups ?? [];
  const group = groups.find((each) => each.optionIds.includes(optionId));
  return group?.id ?? "to-do";
}

const IN_GROUP: FilterOperator = {
  id: "in-group",
  label: TEXT.isInGroup,
  needsOperand: true,
  test: (value, operand, context) => {
    const optionId = selectProperty.read(value);
    if (context === undefined || typeof optionId !== "string") return false;
    return statusGroupOf(context.property, optionId) === operand;
  },
  choices: () =>
    STATUS_GROUP_IDS.map((id) => ({ id, label: TEXT.statusGroups[id] })),
};

function defaultConfig(): StatusConfig {
  return { groups: STATUS_GROUP_IDS.map((id) => ({ id, optionIds: [] })) };
}

const STARTING_OPTIONS = [
  { name: TEXT.statusOptions.todo, color: "gray" },
  { name: TEXT.statusOptions.doing, color: "blue" },
  { name: TEXT.statusOptions.done, color: "green" },
] as const;

export const statusProperty: PropertyType = {
  ...selectProperty,
  type: "status",
  label: TEXT.statusName,
  icon: "status",
  editorFor: (property) => (showsAsCheckbox(property) ? "toggle" : "options"),
  renderCell(value, property, cell) {
    if (!showsAsCheckbox(property))
      return selectProperty.renderCell(value, property, cell);
    return checkboxProperty.renderCell(
      isStatusChecked(property, value),
      property,
    );
  },
  filterOperators: [...selectProperty.filterOperators, IN_GROUP],
  configSchema: statusConfigSchema,
  defaultConfig,
  startingSettings: {
    optionCount: STARTING_OPTIONS.length,
    create: (optionIds) => {
      const options = STARTING_OPTIONS.flatMap((option, index) => {
        const id = optionIds[index];
        return id === undefined ? [] : [{ id, ...option }];
      });
      const groups = STATUS_GROUP_IDS.map((id, index) => ({
        id,
        optionIds: options.slice(index, index + 1).map((option) => option.id),
      }));
      return { options, config: { groups } };
    },
  },
};
