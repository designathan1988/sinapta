// The rows of "Edit cadence" that open a list beside it, as Notion's:
// At (around midnight, or a quarter hour), Start and the last day (a
// calendar), Ending (never, after a number of runs, on a day).
import { html, nothing, type TemplateResult } from "lit-html";
import type { BlockId } from "../../model/index.ts";
import {
  setOverlayValues,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderDatePicker } from "../../ui/date-picker/index.ts";
import { renderSelect, type SelectOption } from "../../ui/select/index.ts";
import {
  CADENCE_VALUES,
  writeDraft,
  type CadenceDraft,
  type Ending,
} from "./template-cadence.ts";

const TEXT = COPY.cadence;

export interface CadenceContext {
  readonly state: AppState;
  readonly dispatch: Dispatch;
  readonly templateId: BlockId;
  readonly draft: CadenceDraft;
  readonly today: string;
}

export function changeDraft(
  context: CadenceContext,
  change: Partial<CadenceDraft>,
): void {
  const values = writeDraft({ ...context.draft, ...change });
  context.dispatch(setOverlayValues.create({ name: CADENCE_VALUES, values }));
}

const SHORT = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
});

export function dayLabel(day: string, today: string): string {
  const tomorrow = new Date(`${today}T00:00:00Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return day === tomorrow.toISOString().slice(0, 10)
    ? TEXT.tomorrow
    : SHORT.format(new Date(`${day}T00:00:00Z`));
}

// "Around midnight", then every quarter hour from 3:15 to 23:45.
function timeOptions(): SelectOption[] {
  const times = Array.from({ length: 83 }, (_, index) => {
    const minutes = 3 * 60 + 15 + index * 15;
    const hour = Math.floor(minutes / 60);
    const minute = String(minutes % 60).padStart(2, "0");
    return {
      value: `${String(hour).padStart(2, "0")}:${minute}`,
      label: `${String(hour)}:${minute}`,
    };
  });
  return [
    { value: "", label: TEXT.midnight, description: TEXT.midnightHours },
    ...times,
  ];
}

// A row that opens a list: the select's own row shows its label.
function renderSelectRow(control: TemplateResult): TemplateResult {
  return html`<div class="cadence__row" data-select>${control}</div>`;
}

function renderRow(label: string, control: TemplateResult): TemplateResult {
  return html`<div class="cadence__row">
    <span class="cadence__label">${label}</span>${control}
  </div>`;
}

export function renderAtRow(context: CadenceContext): TemplateResult {
  const { state, dispatch, draft, templateId } = context;
  return renderSelectRow(
    renderSelect(
      {
        id: `cadence-at:${templateId}`,
        label: TEXT.at,
        value: draft.time,
        variant: "row",
        options: timeOptions(),
        onChoose: (time) => {
          changeDraft(context, { time });
        },
      },
      { overlay: state.ui.overlay, dispatch },
    ),
  );
}

interface DayRow {
  readonly key: "start" | "endsOn";
  readonly label: string;
}

// A day chosen from a calendar beside the row.
export function renderDayRow(
  context: CadenceContext,
  row: DayRow,
): TemplateResult {
  const { state, dispatch, draft, templateId, today } = context;
  const day = draft[row.key];
  const picker = renderDatePicker({
    label: row.label,
    value: { start: day },
    month: draft.month,
    today,
    hasFields: false,
    onChange: (next) => {
      if (next !== undefined) changeDraft(context, { [row.key]: next.start });
    },
    onMonth: (month) => {
      changeDraft(context, { month });
    },
  });
  return renderSelectRow(
    renderSelect(
      {
        id: `cadence-${row.key}:${templateId}`,
        label: row.label,
        value: day,
        variant: "row",
        display: html`${dayLabel(day, today)}`,
        options: [],
        menu: { lead: picker, items: [] },
        onChoose: () => undefined,
      },
      { overlay: state.ui.overlay, dispatch },
    ),
  );
}

const ENDINGS: readonly Ending[] = ["never", "count", "date"];

function renderRunsRow(context: CadenceContext): TemplateResult {
  return renderRow(
    TEXT.runs,
    html`<input
      class="cadence__number"
      type="number"
      min="1"
      max="99"
      aria-label=${TEXT.runs}
      .value=${String(context.draft.count)}
      @change=${(event: Event) => {
        if (!(event.target instanceof HTMLInputElement)) return;
        changeDraft(context, { count: Number(event.target.value) });
      }}
    />`,
  );
}

// Ending, and under it the number of runs or the last day it asks for.
export function renderEndingRows(context: CadenceContext): TemplateResult {
  const { state, dispatch, draft, templateId } = context;
  const ending = renderSelectRow(
    renderSelect(
      {
        id: `cadence-ending:${templateId}`,
        label: TEXT.ending,
        value: draft.ending,
        variant: "row",
        options: ENDINGS.map((value) => ({
          value,
          label: TEXT.endings[value],
        })),
        onChoose: (value) => {
          const chosen = ENDINGS.find((each) => each === value);
          if (chosen !== undefined) changeDraft(context, { ending: chosen });
        },
      },
      { overlay: state.ui.overlay, dispatch },
    ),
  );
  if (draft.ending === "count") return html`${ending}${renderRunsRow(context)}`;
  if (draft.ending === "date") {
    return html`${ending}${renderDayRow(context, { key: "endsOn", label: TEXT.endsOn })}`;
  }
  return html`${ending}${nothing}`;
}

// The reader's own time zone, as "GMT-3": the rows are made on this
// computer's clock.
export function renderTimeZoneRow(): TemplateResult {
  const zone =
    new Intl.DateTimeFormat("en-US", { timeZoneName: "short" })
      .formatToParts(new Date())
      .find((part) => part.type === "timeZoneName")?.value ?? "";
  return renderRow(
    TEXT.timeZone,
    html`<span class="cadence__value">${zone}</span>`,
  );
}
