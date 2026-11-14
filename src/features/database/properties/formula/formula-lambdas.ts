// Forms whose arguments are worked out item by item or with names bound:
// map, filter, find, findIndex, some, every and sort over a list, where
// `current` and `index` name the item, and let and lets, which name values.
import type { FormulaNode } from "./formula-parse.ts";
import {
  asList,
  FormulaError,
  isDate,
  isEmptyValue,
  valueText,
  type FormulaValue,
} from "./formula-value.ts";

export interface Scope {
  // The list item a list form is working on, and its place.
  readonly current: FormulaValue;
  readonly index: number;
  // The names let() and lets() bound.
  readonly variables: ReadonlyMap<string, FormulaValue>;
}

type Run<E extends Scope> = (node: FormulaNode, env: E) => FormulaValue;
type Test = (item: FormulaValue, index: number) => FormulaValue;
type ListForm = (list: readonly FormulaValue[], test: Test) => FormulaValue;

const holds = (value: FormulaValue): boolean => !isEmptyValue(value);

function order(a: FormulaValue, b: FormulaValue): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (isDate(a) && isDate(b)) return a.start.localeCompare(b.start);
  return valueText(a).localeCompare(valueText(b));
}

// Sorted by the items, or by what the second argument makes of each.
function sortBy(list: readonly FormulaValue[], key: Test): FormulaValue {
  const keyed = list.map((item, index) => ({ item, key: key(item, index) }));
  return keyed.sort((a, b) => order(a.key, b.key)).map((each) => each.item);
}

const LIST_FORMS: Readonly<Record<string, ListForm>> = {
  map: (list, test) => list.map(test),
  filter: (list, test) => list.filter((item, at) => holds(test(item, at))),
  find: (list, test) => list.find((item, at) => holds(test(item, at))) ?? null,
  findIndex: (list, test) =>
    list.findIndex((item, at) => holds(test(item, at))),
  some: (list, test) => list.some((item, at) => holds(test(item, at))),
  every: (list, test) => list.every((item, at) => holds(test(item, at))),
  sort: sortBy,
};

export function isListForm(name: string): boolean {
  return LIST_FORMS[name] !== undefined;
}

export function overList<E extends Scope>(
  node: FormulaNode & { kind: "call" },
  env: E,
  run: Run<E>,
): FormulaValue {
  const form = LIST_FORMS[node.name];
  const [listNode, body] = node.args;
  if (form === undefined || listNode === undefined) return null;
  const list = asList(run(listNode, env), node.name);
  const test: Test = (current, index) =>
    body === undefined ? current : run(body, { ...env, current, index });
  return form(list, test);
}

function bindingName(node: FormulaNode | undefined): string {
  if (node?.kind === "name") return node.name;
  throw new FormulaError("let names a value with a plain word.");
}

// let(name, value, result) and lets(name, value, name, value, …, result).
export function withNames<E extends Scope>(
  args: readonly FormulaNode[],
  env: E,
  run: Run<E>,
): FormulaValue {
  if (args.length % 2 === 0) {
    throw new FormulaError("lets takes names with values, then a result.");
  }
  let scope = env;
  for (let at = 0; at + 1 < args.length; at += 2) {
    const name = bindingName(args[at]);
    const valueNode = args[at + 1];
    const value = valueNode === undefined ? null : run(valueNode, scope);
    const variables = new Map(scope.variables).set(name, value);
    scope = { ...scope, variables };
  }
  const result = args.at(-1);
  return result === undefined ? null : run(result, scope);
}
