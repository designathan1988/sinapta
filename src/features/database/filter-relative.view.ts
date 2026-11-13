// The operand of "Is relative to today", as Notion's: two selects, the
// direction (Past, Next, This) and the span (day, week, month, year);
// in a rule's popover, under them, the month with the days the filter
// keeps lit and today marked, and the note that the filter follows
// today's date. A row of the advanced filter shows the selects alone.
import { html, nothing, type TemplateResult } from "lit-html";
import { openOverlayPanel } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { monthOf, renderDatePicker } from "../../ui/date-picker/index.ts";
import { renderSelect, type SelectContext } from "../../ui/select/index.ts";
import {
  readRelative,
  relativeSpan,
  RELATIVE_DIRECTIONS,
  RELATIVE_UNITS,
  writeRelative,
  type Relative,
} from "./properties/date/index.ts";
import type { TableContext } from "./table-cell.view.ts";

const MONTH_PANEL = "month:";

export interface RelativeProps {
  readonly id: string;
  readonly operand: string;
  readonly onChange: (operand: string) => void;
  // True in a row of the advanced filter: the selects without the month.
  readonly isCompact?: boolean;
}

type Part = "direction" | "unit";

function partOptions(part: Part) {
  const { relativeDirections, relativeUnits } = COPY.database;
  return part === "direction"
    ? RELATIVE_DIRECTIONS.map((value) => ({
        value,
        label: relativeDirections[value],
      }))
    : RELATIVE_UNITS.map((value) => ({
        value,
        label: relativeUnits[value],
      }));
}

function renderPart(
  props: RelativeProps,
  part: Part,
  select: SelectContext,
): TemplateResult {
  const relative = readRelative(props.operand) ?? {
    direction: "this",
    unit: "week",
  };
  return renderSelect(
    {
      id: `${props.id}-${part}`,
      label: COPY.database.relativeToToday,
      value: relative[part],
      options: partOptions(part),
      onChoose: (value) => {
        const next = readRelative(
          part === "direction"
            ? `${value}:${relative.unit}`
            : `${relative.direction}:${value}`,
        );
        if (next !== undefined) props.onChange(writeRelative(next));
      },
    },
    select,
  );
}

function renderMonth(relative: Relative, context: TableContext) {
  // Today in the reader's own time zone.
  const today = new Date().toLocaleDateString("en-CA");
  const weekStartsOn = context.model.view.calendar.weekStartsOn;
  const span = relativeSpan(relative, today, weekStartsOn);
  const panel = context.state.ui.overlay?.panel;
  const month =
    panel?.startsWith(MONTH_PANEL) === true
      ? panel.slice(MONTH_PANEL.length)
      : monthOf(today);
  return html`${renderDatePicker({
      label: COPY.database.relativeToToday,
      value: { start: span.from, end: span.to },
      month,
      today,
      hasFields: false,
      onChange: () => undefined,
      onMonth: (next) =>
        context.dispatch(
          openOverlayPanel.create({ panel: `${MONTH_PANEL}${next}` }),
        ),
    })}
    <p class="database__relative-note">${COPY.database.relativeNote}</p>`;
}

export function renderRelativeOperand(
  props: RelativeProps,
  context: TableContext,
): TemplateResult {
  const relative = readRelative(props.operand) ?? {
    direction: "this",
    unit: "week",
  };
  const select = {
    overlay: context.state.ui.overlay,
    dispatch: context.dispatch,
  };
  return html`<div class="database__relative">
    <div class="database__relative-parts">
      ${renderPart(props, "direction", select)}
      ${renderPart(props, "unit", select)}
    </div>
    ${props.isCompact === true ? nothing : renderMonth(relative, context)}
  </div>`;
}
