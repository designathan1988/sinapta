// What a filter condition offers to choose, shared by a rule's popover
// and a row of the advanced filter: a rollup's Any, None or Every, and
// the conditions under it; a retired condition only while it is chosen.
import { html, nothing, type TemplateResult } from "lit-html";
import { COPY } from "../../ui/copy.ts";
import { renderSelect, type SelectContext } from "../../ui/select/index.ts";
import {
  quantifiedId,
  quantifierOf,
  QUANTIFIERS,
  unquantified,
} from "./filter-quantifier.ts";
import type { FilterOperator } from "./property-definition.ts";

export function offeredConditions(
  operators: readonly FilterOperator[],
  current: string,
): FilterOperator[] {
  const quantifier = quantifierOf(current);
  return operators.filter(
    (item) =>
      (item.isRetired !== true || item.id === current) &&
      quantifierOf(item.id) === quantifier,
  );
}

export interface QuantifierProps {
  readonly id: string;
  readonly operator: string;
  readonly onChange: (operator: string) => void;
}

// "Contains" reads "contains" after the property's name, as in Notion's
// head; its menus keep the capital.
export function inSentence(label: string): string {
  return label.charAt(0).toLocaleLowerCase("en-US") + label.slice(1);
}

// Any, None or Every, for a rollup's condition; nothing for the others.
export function renderQuantifierChoice(
  props: QuantifierProps,
  select: SelectContext,
): TemplateResult | typeof nothing {
  const current = quantifierOf(props.operator);
  if (current === undefined) return nothing;
  const base = unquantified(props.operator);
  return renderSelect(
    {
      id: `${props.id}-quantifier`,
      label: COPY.database.quantifierChoice,
      value: current,
      variant: "quiet",
      display: html`${inSentence(COPY.database.quantifiers[current])}`,
      options: QUANTIFIERS.map((value) => ({
        value,
        label: COPY.database.quantifiers[value],
      })),
      onChoose: (value) => {
        const id = quantifiedId(value, base);
        if (id !== undefined) props.onChange(id);
      },
    },
    select,
  );
}
