// Who made a row, or changed it last (ADR-0013): kept on the row's own
// record by the dispatcher, so shown and never edited, as Notion's.
import type { PropertyType } from "../../property-definition.ts";

function readName(stored: unknown): string | undefined {
  if (typeof stored !== "object" || stored === null || !("name" in stored)) {
    return undefined;
  }
  return typeof stored.name === "string" ? stored.name : undefined;
}

function formatName(value: unknown): string {
  return readName(value) ?? (typeof value === "string" ? value : "");
}

export function personStampProperty(
  type: string,
  label: string,
  field: "createdBy" | "editedBy",
): PropertyType {
  return {
    type,
    label,
    icon: "person",
    editor: "none",
    input: { type: "text" },
    computedFrom: field,
    read: readName,
    parse: () => undefined,
    format: formatName,
    compare: (a, b) => formatName(a).localeCompare(formatName(b)),
    filterOperators: [
      {
        id: "contains",
        label: "Contains",
        needsOperand: true,
        test: (value, operand) =>
          formatName(value)
            .toLowerCase()
            .includes(operand.trim().toLowerCase()),
      },
      {
        id: "is-empty",
        label: "Is empty",
        needsOperand: false,
        test: (value) => formatName(value) === "",
      },
    ],
    renderCell: formatName,
  };
}

export const createdByProperty = personStampProperty(
  "created-by",
  "Created by",
  "createdBy",
);

export const editedByProperty = personStampProperty(
  "edited-by",
  "Last edited by",
  "editedBy",
);
