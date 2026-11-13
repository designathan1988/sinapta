// A status shown as a checkbox, as Notion's: ticked while the value is in
// the Complete group; ticking sets Complete's first option, unticking
// To-do's first. Without an option in Complete the box cannot be ticked.
import type { PropertyDefinition } from "../../../../blocks/database/index.ts";
import { readStatusConfig, type StatusGroupId } from "./status.schema.ts";

export function showsAsCheckbox(property: PropertyDefinition): boolean {
  return readStatusConfig(property.config)?.showAs === "checkbox";
}

function groupOf(
  property: PropertyDefinition,
  optionId: unknown,
): StatusGroupId {
  const groups = readStatusConfig(property.config)?.groups ?? [];
  const found = groups.find(
    (group) =>
      typeof optionId === "string" && group.optionIds.includes(optionId),
  );
  return found?.id ?? "to-do";
}

export function isStatusChecked(
  property: PropertyDefinition,
  value: unknown,
): boolean {
  return value !== undefined && groupOf(property, value) === "complete";
}

// The option a tick or an untick sets; undefined when there is none,
// which leaves the value as it is.
export function statusOptionFor(
  property: PropertyDefinition,
  checked: boolean,
): string | undefined {
  const groups = readStatusConfig(property.config)?.groups ?? [];
  const id: StatusGroupId = checked ? "complete" : "to-do";
  return groups.find((group) => group.id === id)?.optionIds[0];
}
