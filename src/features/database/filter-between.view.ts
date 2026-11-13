// The operand of "Is between", as Notion's: two day fields, the first day
// and the last, kept as "start..end" once each is left.
import { html, type TemplateResult } from "lit-html";
import { COPY } from "../../ui/copy.ts";
import { BETWEEN_SEPARATOR } from "./properties/date/index.ts";

export interface BetweenProps {
  readonly operand: string;
  readonly onChange: (operand: string) => void;
}

export function renderBetweenOperand(props: BetweenProps): TemplateResult {
  const [from = "", to = ""] = props.operand.split(BETWEEN_SEPARATOR);
  // The fields' own changes, which no field of the rule reads.
  const onChange = (event: Event): void => {
    event.stopPropagation();
    const holder = event.currentTarget;
    if (!(holder instanceof HTMLElement)) return;
    const [first, last] = [...holder.querySelectorAll("input")].map(
      (field) => field.value,
    );
    props.onChange([first ?? "", last ?? ""].join(BETWEEN_SEPARATOR));
  };
  return html`<div class="database__between" @change=${onChange}>
    <input
      class="database__field"
      type="date"
      aria-label=${COPY.database.dateEnds.start}
      .value=${from}
    />
    <span aria-hidden="true">→</span>
    <input
      class="database__field"
      type="date"
      aria-label=${COPY.database.dateEnds.end}
      .value=${to}
    />
  </div>`;
}
