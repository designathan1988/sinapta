// What a property type tells the table about itself: how its values are
// read, compared, filtered, shown and edited.
import { COPY } from "../../ui/copy.ts";
import type { TemplateResult } from "lit-html";
import type {
  PropertyConfigSchema,
  PropertyDefinition,
} from "../../blocks/database/index.ts";
import type { PageBlock } from "../../blocks/page/index.ts";
import type { BlockId, Filter } from "../../model/index.ts";
import type { AppState, Dispatch } from "../../state/index.ts";
import type { IconName } from "../../ui/icon/index.ts";
import type { Grouping } from "./grouping-definition.ts";

// What a filter knows besides the value and the operand.
export interface FilterContext {
  readonly property: PropertyDefinition;
  // Today as "YYYY-MM-DD", for filters relative to it; absent or empty
  // when unknown, and then such filters match nothing.
  readonly today?: string;
  // The day weeks start on, 0 Sunday or 1 Monday, for "this week".
  readonly weekStartsOn?: 0 | 1 | undefined;
  // The whole condition, for settings beside its operand, such as which
  // end of a date range it tests.
  readonly filter?: Filter | undefined;
  // The row and the workspace, for conditions on values worked out from
  // other rows, such as a rollup's.
  readonly rowId?: BlockId | undefined;
  readonly state?: AppState | undefined;
}

// One value a filter's operand may take, such as a status group.
export interface OperandChoice {
  readonly id: string;
  readonly label: string;
}

export interface FilterOperator {
  readonly id: string;
  readonly label: string;
  // False for operators such as "is empty" that compare with nothing.
  readonly needsOperand: boolean;
  readonly test: (
    value: unknown,
    operand: string,
    context?: FilterContext,
  ) => boolean;
  // The operands to choose from, when not the property's options.
  readonly choices?: (property: PropertyDefinition) => readonly OperandChoice[];
  // How the operand is chosen when not typed or picked from choices:
  // "relative" draws Notion's two selects (Past/Next/This, Day…Year).
  // "between" draws two day fields, the operand "start..end".
  readonly operandEditor?: "relative" | "between";
  // The operand in words, for a filter's pill, as "This week".
  readonly describe?: (operand: string) => string;
  // The operand a new condition starts with, as "this:week".
  readonly defaultOperand?: string;
  // Kept for conditions saved before Notion dropped it, never offered.
  readonly isRetired?: boolean;
  // The choices listed as rows in a filter's popover, as Notion lists a
  // checkbox's Unchecked and Checked; a color rule still picks from a list.
  readonly listsChoices?: boolean;
}

// The options and config a new property of a type starts with, such as a
// status property's three options in its three groups.
export interface StartingSettings {
  readonly optionCount: number;
  readonly create: (
    optionIds: readonly string[],
  ) => Pick<PropertyDefinition, "options" | "config">;
}

// How a cell of this type is edited; "none" for values the app keeps.
export type CellEditor =
  | "text"
  | "number"
  | "date"
  | "url"
  | "toggle"
  | "options"
  | "files"
  | "relation"
  | "button"
  | "none";

// What a cell may need besides its value, such as the addresses of the
// files kept for the workspace.
export interface CellContext {
  readonly assetUrls: Readonly<Record<string, string>>;
  // The title of a page that is shown; undefined for a page that is gone
  // or in the trash.
  readonly titleOf?: (pageId: string) => string | undefined;
}

// What a computed value may read: the workspace, and today as
// "YYYY-MM-DD" (empty when unknown) for formulas such as today().
export interface ComputeContext {
  readonly state: AppState;
  readonly today: string;
}

// What a type's settings may need besides the property: the database it
// belongs to, the workspace and the way to change it.
export interface ConfigContext {
  readonly databaseId: BlockId;
  readonly state: AppState;
  readonly dispatch: Dispatch;
}

// The `type` and `inputmode` of the field that edits a value as text.
export interface InputKind {
  readonly type?: string;
  readonly mode?: string;
}

// Values a type gives rows by itself, such as a unique ID's numbers: one
// for each row a database has when the property is added, and one for
// each row added later. Each returns the property as it is afterwards.
export interface RowNumbering {
  readonly start: (
    property: PropertyDefinition,
    rowCount: number,
  ) => { property: PropertyDefinition; values: readonly unknown[] };
  readonly next: (property: PropertyDefinition) => {
    property: PropertyDefinition;
    value: unknown;
  };
}

export interface PropertyType {
  readonly type: string;
  readonly label: string;
  // Shown before the property's name in headers and menus.
  readonly icon: IconName;
  readonly editor: CellEditor;
  // How a cell is edited when it depends on the property's settings, as
  // a status shown as a checkbox is toggled.
  readonly editorFor?: (property: PropertyDefinition) => CellEditor;
  readonly input?: InputKind;
  // A value that is not stored but read from the row's own record.
  readonly computedFrom?: "createdAt" | "updatedAt";
  // The stored value in this type's form; undefined when the cell is
  // empty or holds something this type cannot use.
  readonly read: (stored: unknown) => unknown;
  // Text typed into an editor as a value to store; undefined clears. The
  // value it replaces lets a type keep what the text does not hold, such
  // as the end of a date range.
  readonly parse: (text: string, previous?: unknown) => unknown;
  // The value as plain text, for editing and for search.
  readonly format: (
    value: unknown,
    property: PropertyDefinition,
    cell?: CellContext,
  ) => string;
  // Ascending order of two values that `read` returned.
  readonly compare: (a: unknown, b: unknown) => number;
  readonly filterOperators: readonly FilterOperator[];
  // Conditions built from the property's settings, when they depend on
  // them, such as a rollup's on the property it reads.
  readonly filterOperatorsFor?: (
    property: PropertyDefinition,
    state?: AppState,
  ) => readonly FilterOperator[];
  // The condition a new filter on this type starts with, when not the
  // first; a text filter starts with Contains, as Notion's.
  readonly defaultFilter?: string;
  readonly renderCell: (
    value: unknown,
    property: PropertyDefinition,
    cell?: CellContext,
  ) => TemplateResult | string;
  // The shape of this type's settings, such as a number's format, checked
  // when a workspace loads. A property without a config uses
  // `defaultConfig`.
  readonly configSchema?: PropertyConfigSchema;
  readonly defaultConfig?: () => unknown;
  readonly startingSettings?: StartingSettings;
  readonly numbering?: RowNumbering;
  // The value a new row starts with, as a status's first To-do option in
  // Notion; absent, none.
  readonly newRowValue?: (property: PropertyDefinition) => unknown;
  // A value worked out from the workspace, never stored, such as a
  // rollup's.
  readonly compute?: (
    row: PageBlock,
    property: PropertyDefinition,
    context: ComputeContext,
  ) => unknown;
  // How views group rows by this type's values; without it, by the
  // value's text.
  readonly grouping?: Grouping;
  // The settings shown in the property's menu.
  readonly renderConfigEditor?: (
    property: PropertyDefinition,
    onChange: (config: unknown) => void,
    context: ConfigContext,
  ) => TemplateResult;
}

export const IS_EMPTY: FilterOperator = {
  id: "is-empty",
  label: COPY.operators.isEmpty,
  needsOperand: false,
  test: (value) => value === undefined,
};

export const IS_NOT_EMPTY: FilterOperator = {
  id: "is-not-empty",
  label: COPY.operators.isNotEmpty,
  needsOperand: false,
  test: (value) => value !== undefined,
};

// Comparison that ignores case in every language.
export function foldText(text: string): string {
  return text.normalize("NFKC").toLocaleLowerCase("en-US");
}

export function containsText(
  label: string = COPY.operators.contains,
): FilterOperator {
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
