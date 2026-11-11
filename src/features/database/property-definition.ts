// What a property type tells the table about itself: how its values are
// read, compared, filtered, shown and edited.
import type { TemplateResult } from "lit-html";
import type { PropertyDefinition } from "../../blocks/database/index.ts";

export interface FilterOperator {
  readonly id: string;
  readonly label: string;
  // False for operators such as "is empty" that compare with nothing.
  readonly needsOperand: boolean;
  readonly test: (value: unknown, operand: string) => boolean;
}

// How a cell of this type is edited; "none" for values the app keeps.
export type CellEditor =
  "text" | "number" | "date" | "url" | "toggle" | "options" | "none";

// The `type` and `inputmode` of the field that edits a value as text.
export interface InputKind {
  readonly type?: string;
  readonly mode?: string;
}

export interface PropertyType {
  readonly type: string;
  readonly label: string;
  readonly editor: CellEditor;
  readonly input?: InputKind;
  // A value that is not stored but read from the row's own record.
  readonly computedFrom?: "createdAt" | "updatedAt";
  // The stored value in this type's form; undefined when the cell is
  // empty or holds something this type cannot use.
  readonly read: (stored: unknown) => unknown;
  // Text typed into an editor as a value to store; undefined clears.
  readonly parse: (text: string) => unknown;
  // The value as plain text, for editing and for search.
  readonly format: (value: unknown, property: PropertyDefinition) => string;
  // Ascending order of two values that `read` returned.
  readonly compare: (a: unknown, b: unknown) => number;
  readonly filterOperators: readonly FilterOperator[];
  readonly renderCell: (
    value: unknown,
    property: PropertyDefinition,
  ) => TemplateResult | string;
}

export const IS_EMPTY: FilterOperator = {
  id: "is-empty",
  label: "Is empty",
  needsOperand: false,
  test: (value) => value === undefined,
};

export const IS_NOT_EMPTY: FilterOperator = {
  id: "is-not-empty",
  label: "Is not empty",
  needsOperand: false,
  test: (value) => value !== undefined,
};

// Comparison that ignores case in every language.
export function foldText(text: string): string {
  return text.normalize("NFKC").toLocaleLowerCase("en-US");
}

export function containsText(label = "Contains"): FilterOperator {
  return {
    id: "contains",
    label,
    needsOperand: true,
    test: (value, operand) =>
      typeof value === "string" && foldText(value).includes(foldText(operand)),
  };
}

export function compareText(a: unknown, b: unknown): number {
  return String(a).localeCompare(String(b), "en-US", {
    numeric: true,
    sensitivity: "base",
  });
}
