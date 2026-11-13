// The head of a filter rule's popover, as Notion's: the property's name
// (for a date, which end of it the rule tests), the condition with a
// chevron, written as Notion writes it after the name ("contains"), and
// a "…" that opens Delete filter and Add to advanced filter. A rollup's
// rule first chooses Any, None or Every of the related values.
import { html, type TemplateResult } from "lit-html";
import type { PropertyDefinition } from "../../blocks/database/index.ts";
import type { Filter } from "../../model/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { renderSelect, type SelectContext } from "../../ui/select/index.ts";
import type { FieldChange } from "./filter-row.view.ts";
import {
  inSentence,
  offeredConditions,
  renderQuantifierChoice,
} from "./filter-condition.view.ts";
import type { FilterOperator } from "./property-definition.ts";

export interface RuleHead {
  readonly id: string;
  readonly filter: Filter;
  readonly property: PropertyDefinition | undefined;
  readonly operators: readonly FilterOperator[];
  readonly change: (change: FieldChange) => void;
  readonly remove: () => void;
  readonly toAdvanced: () => void;
  // What ends the head in place of the "…", as a color rule's Delete.
  readonly trailing?: TemplateResult;
}

function renderDateEnd(head: RuleHead, select: SelectContext): TemplateResult {
  const { dateEnds } = COPY.database;
  return renderSelect(
    {
      id: `${head.id}-date-end`,
      label: COPY.database.dateEndChoice,
      value: head.filter.dateEnd ?? "start",
      variant: "quiet",
      options: [
        { value: "start", label: dateEnds.start },
        { value: "end", label: dateEnds.end },
      ],
      onChoose: (value) => {
        head.change({ field: "dateEnd", value });
      },
    },
    select,
  );
}

function renderName(head: RuleHead, select: SelectContext) {
  if (head.property?.type === "date") return renderDateEnd(head, select);
  return html`<span class="database__rule-name"
    >${head.property?.name ?? ""}</span
  >`;
}

function renderCondition(head: RuleHead, select: SelectContext) {
  const current = head.operators.find(
    (item) => item.id === head.filter.operator,
  );
  return renderSelect(
    {
      id: `${head.id}-operator`,
      label: COPY.database.filterOperator,
      value: head.filter.operator,
      variant: "quiet",
      display: html`${inSentence(current?.label ?? "")}`,
      options: offeredConditions(head.operators, head.filter.operator).map(
        (item) => ({ value: item.id, label: item.label }),
      ),
      onChoose: (value) => {
        head.change({ field: "operator", value });
      },
    },
    select,
  );
}

function renderMore(head: RuleHead, select: SelectContext): TemplateResult {
  const { deleteFilter, addToAdvanced, filterActions } = COPY.database;
  return renderSelect(
    {
      id: `${head.id}-more`,
      label: filterActions,
      value: undefined,
      variant: "icon",
      display: renderIcon("more"),
      options: [],
      onChoose: () => undefined,
      menu: {
        items: [
          {
            label: deleteFilter,
            icon: "trash",
            onSelect: head.remove,
          },
          {
            label: addToAdvanced,
            icon: "filter",
            onSelect: head.toAdvanced,
          },
        ],
      },
    },
    select,
  );
}

export function renderRuleHead(
  head: RuleHead,
  select: SelectContext,
): TemplateResult {
  return html`<div class="database__rule-head">
    ${renderName(head, select)}
    ${renderQuantifierChoice(
      {
        id: head.id,
        operator: head.filter.operator,
        onChange: (value) => {
          head.change({ field: "operator", value });
        },
      },
      select,
    )}
    ${renderCondition(head, select)}
    <span class="database__spacer"></span>
    ${head.trailing ?? renderMore(head, select)}
  </div>`;
}
