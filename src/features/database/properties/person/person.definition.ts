// Notion's Person property (ADR-0013): people of the workspace, chosen in
// the cell's popover, kept with their names as they were when chosen.
import { compareText, type PropertyType } from "../../property-definition.ts";

export interface PersonValue {
  readonly id: string;
  readonly name: string;
}

function readOne(item: unknown): PersonValue | undefined {
  if (typeof item !== "object" || item === null) return undefined;
  const fields = Object.fromEntries(Object.entries(item));
  const { id, name } = fields;
  return typeof id === "string" && typeof name === "string"
    ? { id, name }
    : undefined;
}

export function readPeople(stored: unknown): PersonValue[] | undefined {
  if (!Array.isArray(stored)) return undefined;
  const people = stored.flatMap((item: unknown) => readOne(item) ?? []);
  return people.length === 0 ? undefined : people;
}

function formatPeople(value: unknown): string {
  return (readPeople(value) ?? []).map((person) => person.name).join(", ");
}

export const personProperty: PropertyType = {
  type: "person",
  label: "Person",
  icon: "person",
  editor: "relation",
  input: { type: "text" },
  read: readPeople,
  parse: () => undefined,
  format: formatPeople,
  compare: compareText,
  filterOperators: [
    {
      id: "contains",
      label: "Contains",
      needsOperand: true,
      test: (value, operand) =>
        formatPeople(value)
          .toLowerCase()
          .includes(operand.trim().toLowerCase()),
    },
    {
      id: "is-empty",
      label: "Is empty",
      needsOperand: false,
      test: (value) => formatPeople(value) === "",
    },
    {
      id: "is-not-empty",
      label: "Is not empty",
      needsOperand: false,
      test: (value) => formatPeople(value) !== "",
    },
  ],
  defaultFilter: "contains",
  // A group for each person, as Notion's; a row with two people is in
  // both, and one with none in "No <name>".
  grouping: {
    keysOf: (value) =>
      (readPeople(value) ?? []).map((person) => ({
        key: person.id,
        label: person.name,
      })),
  },
  renderCell: formatPeople,
};
