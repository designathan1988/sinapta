// A rollup's conditions are its target's, each asked of Any, None or
// Every related value, as Notion's: the id "every:is" asks "is" of every
// related value.
export const QUANTIFIERS = ["any", "none", "every"] as const;

export type Quantifier = (typeof QUANTIFIERS)[number];

function isQuantifier(text: string): text is Quantifier {
  return QUANTIFIERS.some((item) => item === text);
}

export function quantifierOf(id: string): Quantifier | undefined {
  const head = id.split(":")[0] ?? "";
  return id.includes(":") && isQuantifier(head) ? head : undefined;
}

// The target's condition a quantified id asks.
export function unquantified(id: string): string {
  return quantifierOf(id) === undefined ? id : id.slice(id.indexOf(":") + 1);
}

export function quantifiedId(
  quantifier: string,
  base: string,
): string | undefined {
  return isQuantifier(quantifier) ? `${quantifier}:${base}` : undefined;
}
