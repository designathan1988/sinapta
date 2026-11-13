// The values a button's actions set, as the press works them out: the
// day of the press for { today: true }, a variable's result for
// { variable }, and the variables themselves, worked out first from the
// row as Notion's "Define variables" does, with prop() reading the row.
import type { PropertyDefinition } from "../../blocks/database/index.ts";
import type { PageBlock } from "../../blocks/page/index.ts";
import { parsePropertyId } from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";
import {
  isToday,
  variableOf,
  type ButtonPropertyAction,
} from "./properties/button/index.ts";
import { propertyType } from "./property-registry.ts";

export type Variables = ReadonlyMap<string, unknown>;

export interface PressContext {
  readonly state: AppState;
  readonly row: PageBlock;
  readonly properties: readonly PropertyDefinition[];
  readonly today: string;
}

// A formula's result as a value a property can take.
function asValue(result: unknown): unknown {
  if (typeof result !== "object" || result === null) return result;
  if ("error" in result) return undefined;
  if ("kind" in result && "start" in result) return { start: result.start };
  return result;
}

const VARIABLE_ID = parsePropertyId("variable");

function variableResult(expression: string, press: PressContext): unknown {
  if (VARIABLE_ID === undefined) return undefined;
  const property: PropertyDefinition = {
    id: VARIABLE_ID,
    name: "",
    type: "formula",
    config: { expression },
  };
  const { state, today, row } = press;
  const compute = propertyType("formula").compute;
  return asValue(compute?.(row, property, { state, today }));
}

export function workOutVariables(
  actions: readonly ButtonPropertyAction[],
  press: PressContext,
): Variables {
  const variables = new Map<string, unknown>();
  for (const action of actions) {
    if (action.kind !== "define-variables") continue;
    for (const { name, expression } of action.variables) {
      variables.set(name, variableResult(expression, press));
    }
  }
  return variables;
}

// The values an action sets, the day and the variables put in.
export function resolveValues(
  values: Readonly<Record<string, unknown>>,
  today: string,
  variables: Variables,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(values).map(([id, value]) => {
      if (isToday(value)) return [id, { start: today }];
      const name = variableOf(value);
      return [id, name === undefined ? value : variables.get(name)];
    }),
  );
}
