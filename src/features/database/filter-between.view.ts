// The operand of "Is between", as Notion's: two day fields, the first day
// and the last, written as the app writes dates and read as typed, kept
// as "start..end" once each is left.
import { html, type TemplateResult } from "lit-html";
import { COPY } from "../../ui/copy.ts";
import { parseTypedDate } from "../../ui/date-picker/index.ts";
import { BETWEEN_SEPARATOR, formatDateValue } from "./properties/date/index.ts";

export interface BetweenProps {
  readonly operand: string;
  readonly onChange: (operand: string) => void;
}

function shown(day: string): string {
  return day === "" ? "" : formatDateValue({ start: day });
}

// A field's day: what it reads as, empty when emptied, else the day it
// held, so a slip of the keys loses nothing.
function typedDay(text: string, held: string, today: string): string {
  if (text.trim() === "") return "";
  return parseTypedDate(text, today) ?? held;
}

export function renderBetweenOperand(props: BetweenProps): TemplateResult {
  const [from = "", to = ""] = props.operand.split(BETWEEN_SEPARATOR);
  // The fields' own changes, which no field of the rule reads.
  const onChange = (event: Event): void => {
    event.stopPropagation();
    const holder = event.currentTarget;
    if (!(holder instanceof HTMLElement)) return;
    const today = new Date().toLocaleDateString("en-CA");
    const [first = "", last = ""] = [...holder.querySelectorAll("input")].map(
      (field) => field.value,
    );
    const days = [typedDay(first, from, today), typedDay(last, to, today)];
    props.onChange(days.join(BETWEEN_SEPARATOR));
  };
  return html`<div class="database__between" @change=${onChange}>
    <input
      class="database__field"
      type="text"
      aria-label=${COPY.database.dateEnds.start}
      .value=${shown(from)}
    />
    <span aria-hidden="true">→</span>
    <input
      class="database__field"
      type="text"
      aria-label=${COPY.database.dateEnds.end}
      .value=${shown(to)}
    />
  </div>`;
}
