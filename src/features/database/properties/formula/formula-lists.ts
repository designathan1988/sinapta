// List and text functions of Notion's formulas 2.0. Text keeps no styles
// here: style(), unstyle() and link() give the words they are handed.
import type { FormulaFunction } from "./formula-dates.ts";
import {
  asList,
  asNumber,
  asText,
  FormulaError,
  isList,
  sameValue,
  type FormulaValue,
} from "./formula-value.ts";

const MANY = Number.POSITIVE_INFINITY;

function regex(source: FormulaValue, flags: string): RegExp {
  try {
    return new RegExp(asText(source), flags);
  } catch {
    throw new FormulaError("The pattern cannot be read.");
  }
}

function unique(list: readonly FormulaValue[]): FormulaValue[] {
  return list.filter(
    (item, at) => list.findIndex((other) => sameValue(other, item)) === at,
  );
}

function flat(list: readonly FormulaValue[]): FormulaValue[] {
  return list.flatMap((item) => (isList(item) ? item : [item]));
}

function pad(atStart: boolean): FormulaFunction {
  return {
    arity: [3, 3],
    call: ([text = null, size = null, filler = null]) => {
      const length = asNumber(size, atStart ? "padStart" : "padEnd");
      const words = asText(text);
      return atStart
        ? words.padStart(length, asText(filler))
        : words.padEnd(length, asText(filler));
    },
  };
}

function repeat(args: readonly FormulaValue[]): FormulaValue {
  const [text = null, times = null] = args;
  const count = asNumber(times, "repeat");
  if (count < 0) throw new FormulaError("repeat needs a count of 0 or more.");
  return asText(text).repeat(Math.floor(count));
}

function substring(args: readonly FormulaValue[]): FormulaValue {
  const [text = null, start = null, end] = args;
  const from = asNumber(start, "substring");
  const to = end === undefined ? undefined : asNumber(end, "substring");
  return asText(text).substring(from, to);
}

export const LIST_FUNCTIONS: Readonly<Record<string, FormulaFunction>> = {
  // What [a, b, c] is read as.
  list: { arity: [0, MANY], call: (args) => [...args] },
  reverse: {
    arity: [1, 1],
    call: ([list = null]) => [...asList(list, "reverse")].reverse(),
  },
  unique: {
    arity: [1, 1],
    call: ([list = null]) => unique(asList(list, "unique")),
  },
  includes: {
    arity: [2, 2],
    call: ([list = null, item = null]) =>
      asList(list, "includes").some((each) => sameValue(each, item)),
  },
  flat: { arity: [1, 1], call: ([list = null]) => flat(asList(list, "flat")) },
  split: {
    arity: [1, 2],
    call: ([text = null, separator = ""]) =>
      asText(text).split(asText(separator)),
  },
  test: {
    arity: [2, 2],
    call: ([text = null, find = null]) => regex(find, "").test(asText(text)),
  },
  match: {
    arity: [2, 2],
    call: ([text = null, find = null]) =>
      asText(text).match(regex(find, "g")) ?? [],
  },
  repeat: { arity: [2, 2], call: repeat },
  padStart: pad(true),
  padEnd: pad(false),
  substring: { arity: [2, 3], call: substring },
  link: { arity: [2, 2], call: ([label = null]) => asText(label) },
  style: { arity: [1, MANY], call: ([text = null]) => asText(text) },
  unstyle: { arity: [1, MANY], call: ([text = null]) => asText(text) },
};
