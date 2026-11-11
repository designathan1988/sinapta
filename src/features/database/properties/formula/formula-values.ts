// What prop("Name") reads: a row's value of that property as a formula
// value. Options read as their names, related pages as their titles, and
// another formula as its own result, worked out in turn.
import {
  selectDatabase,
  type PropertyDefinition,
} from "../../../../blocks/database/index.ts";
import {
  selectIsInTrash,
  selectPage,
  selectPageTitle,
  type PageBlock,
} from "../../../../blocks/page/index.ts";
import { parseBlockId, parsePropertyId } from "../../../../model/index.ts";
import { COPY } from "../../../../ui/copy.ts";
import type { ComputeContext } from "../../property-definition.ts";
import { propertyType } from "../../property-registry.ts";
import { selectRowValues } from "../../row-values.selectors.ts";
import { readDateValue } from "../date/index.ts";
import { readRelation } from "../relation/index.ts";
import {
  compileFormula,
  evaluateFormula,
  type CompileResult,
  type FormulaResult,
  type FormulaValue,
} from "./formula.ts";
import { readFormulaConfig } from "./formula.schema.ts";

// A formula that reads formulas stops this many levels down.
const MAX_DEPTH = 8;

export interface RowReading {
  readonly context: ComputeContext;
  readonly row: PageBlock;
  readonly properties: readonly PropertyDefinition[];
  readonly depth: number;
}

function optionNames(
  stored: unknown,
  property: PropertyDefinition,
): FormulaValue {
  const ids = Array.isArray(stored) ? stored : [stored];
  const names = ids.flatMap((id) => {
    const name = property.options?.find((option) => option.id === id)?.name;
    return name === undefined ? [] : [name];
  });
  return Array.isArray(stored) ? names : (names[0] ?? null);
}

function titles(stored: unknown, reading: RowReading): FormulaValue {
  const { state } = reading.context;
  return (readRelation(stored) ?? []).flatMap((id) => {
    const page = selectPage(state, parseBlockId(id) ?? null);
    return page === undefined || selectIsInTrash(state, page)
      ? []
      : [selectPageTitle(page)];
  });
}

function dateOf(stored: unknown): FormulaValue {
  if (typeof stored === "string" && stored.includes("T")) {
    return { kind: "date", start: stored.slice(0, 16) };
  }
  const date = readDateValue(stored);
  if (date === undefined) return null;
  const start =
    date.time === undefined ? date.start : `${date.start}T${date.time}`;
  return date.end === undefined
    ? { kind: "date", start }
    : { kind: "date", start, end: date.end };
}

// A stored value that is already a plain number, text or true/false.
function plain(value: unknown): FormulaValue {
  if (typeof value === "number" || typeof value === "boolean") return value;
  return typeof value === "string" ? value : null;
}

// Compiled formulas, per list of properties they were checked against;
// a database's list is replaced whenever its properties change.
const compiledFormulas = new WeakMap<
  readonly PropertyDefinition[],
  Map<string, CompileResult>
>();

function compiled(
  property: PropertyDefinition,
  properties: readonly PropertyDefinition[],
): CompileResult {
  const expression = readFormulaConfig(property.config).expression;
  const key = `${property.id}|${expression}`;
  const cache =
    compiledFormulas.get(properties) ?? new Map<string, CompileResult>();
  compiledFormulas.set(properties, cache);
  const known = cache.get(key);
  if (known !== undefined) return known;
  const result = compileFormula(
    expression,
    [...properties, ...titleProperties()],
    property.id,
  );
  cache.set(key, result);
  return result;
}

// The formula's result for the row, or its mistake.
export function formulaResult(
  property: PropertyDefinition,
  reading: RowReading,
): FormulaResult {
  if (reading.depth >= MAX_DEPTH) return null;
  const program = compiled(property, reading.properties);
  if (!program.ok) return { error: program.error };
  return evaluateFormula(program.program, {
    valueOf: (name) =>
      valueByName(name, { ...reading, depth: reading.depth + 1 }),
    now: `${reading.context.today}T00:00`,
  });
}

// Another formula's result as prop() reads it; a mistake reads as empty.
function nestedResult(
  property: PropertyDefinition,
  reading: RowReading,
): FormulaValue {
  const result = formulaResult(property, reading);
  return typeof result === "object" && result !== null && "error" in result
    ? null
    : result;
}

function valueOf(
  property: PropertyDefinition,
  reading: RowReading,
): FormulaValue {
  const stored = selectRowValues(reading.row, [property])[property.id];
  switch (property.type) {
    case "select":
    case "status":
    case "multi-select":
      return optionNames(stored, property);
    case "relation":
      return titles(stored, reading);
    case "date":
    case "created-time":
    case "edited-time":
      return dateOf(stored);
    case "formula":
      return nestedResult(property, reading);
    default:
      return plain(propertyType(property.type).read(stored) ?? null);
  }
}

const TITLE_ID = parsePropertyId("title");

// The row's title as a property, which prop("Name") reads when no
// property is named so.
export function titleProperties(): PropertyDefinition[] {
  return TITLE_ID === undefined
    ? []
    : [{ id: TITLE_ID, name: COPY.database.nameColumn, type: "title" }];
}

export function valueByName(name: string, reading: RowReading): FormulaValue {
  const property = reading.properties.find((each) => each.name === name);
  if (property !== undefined) return valueOf(property, reading);
  return name === COPY.database.nameColumn
    ? selectPageTitle(reading.row)
    : null;
}

// The properties of the row's database, and the database itself.
export function propertiesOf(context: ComputeContext, row: PageBlock) {
  return selectDatabase(context.state, row.parentId)?.props.properties ?? [];
}
