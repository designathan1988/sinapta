// Notion's date picker, drawn above a menu's rows: the chosen days and
// time, the month's name with Today and arrows, and its six weeks of
// days, today marked and the chosen day or range lit. Which month shows
// is the caller's, kept in the store.
import "./date-picker.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { COPY } from "../copy.ts";
import { renderIcon } from "../icon/index.ts";
import { calendarDays, monthOf, shiftMonth } from "./calendar.ts";
import {
  chooseDay,
  withDay,
  type DatePickerProps,
  type DateRangeValue,
} from "./date-picker-value.ts";
import { parseTypedDate } from "./date-parse.ts";

const TEXT = COPY.datePicker;

const MONTH = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const DAY = new Intl.DateTimeFormat("en-US", {
  dateStyle: "full",
  timeZone: "UTC",
});
const SHORT = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
});

function at(day: string): Date {
  return new Date(`${day}T00:00:00Z`);
}

// A chosen day as a field, empty before one is chosen: a day typed into
// it, as "Dec 3" or "12/3/2026", takes its place on Enter; text that is
// no day is put back.
function renderDayField(
  props: DatePickerProps,
  value: DateRangeValue | undefined,
  isEnd: boolean,
): TemplateResult {
  const day = isEnd ? (value?.end ?? value?.start) : value?.start;
  const shown = day === undefined ? "" : SHORT.format(at(day));
  const onDay = (event: Event): void => {
    event.stopPropagation();
    if (!(event.target instanceof HTMLInputElement)) return;
    const typed = parseTypedDate(event.target.value, props.today);
    if (typed === undefined) {
      event.target.value = shown;
      return;
    }
    props.onChange(
      value === undefined ? { start: typed } : withDay(value, typed, isEnd),
    );
  };
  return html`<input
    class="date-picker__field"
    type="text"
    autocomplete="off"
    aria-label=${isEnd ? TEXT.endDate : TEXT.startDate}
    .value=${shown}
    @change=${onDay}
  />`;
}

// A time as a field: the start's, or the end's own.
function renderTimeField(
  props: DatePickerProps,
  isEnd: boolean,
): TemplateResult | typeof nothing {
  const { value } = props;
  const time = isEnd ? value?.endTime : value?.time;
  if (value === undefined || time === undefined) return nothing;
  // The time's change is the picker's own: no form around it reads it.
  const onTime = (event: Event): void => {
    event.stopPropagation();
    if (!(event.target instanceof HTMLInputElement)) return;
    const typed = event.target.value;
    if (typed === "") return;
    props.onChange(
      isEnd ? { ...value, endTime: typed } : { ...value, time: typed },
    );
  };
  return html`<input
    class="date-picker__field"
    type="time"
    aria-label=${isEnd ? TEXT.endTime : TEXT.time}
    .value=${time}
    @change=${onTime}
  />`;
}

// The chosen days as fields, each with its time when it has one.
function renderFields(props: DatePickerProps): TemplateResult {
  const { value } = props;
  return html`<div class="date-picker__fields">
    ${renderDayField(props, value, false)} ${renderTimeField(props, false)}
    ${value?.end === undefined ? nothing : renderDayField(props, value, true)}
    ${renderTimeField(props, true)}
  </div>`;
}

function renderToday(props: DatePickerProps): TemplateResult {
  return html`<button
    type="button"
    class="date-picker__today"
    aria-label=${TEXT.today}
    @click=${() => {
      props.onMonth(monthOf(props.today));
    }}
  >
    ${TEXT.today}
  </button>`;
}

// The month's name, Today, and Notion's chevrons to the months beside it.
function renderHeader(props: DatePickerProps): TemplateResult {
  const arrow = (label: string, icon: "back" | "chevron", by: number) =>
    html`<button
      type="button"
      class="date-picker__nav"
      aria-label=${label}
      @click=${() => {
        props.onMonth(shiftMonth(props.month, by));
      }}
    >
      ${renderIcon(icon)}
    </button>`;
  return html`<div class="date-picker__header">
    <span class="date-picker__month"
      >${MONTH.format(at(`${props.month}-01`))}</span
    >
    ${props.isShownOnly === true ? nothing : renderToday(props)}
    ${arrow(TEXT.previousMonth, "back", -1)}
    ${arrow(TEXT.nextMonth, "chevron", 1)}
  </div>`;
}

function isInRange(day: string, props: DatePickerProps): boolean {
  const { value } = props;
  return value?.end !== undefined && day > value.start && day < value.end;
}

// A day after the range of a month that is only shown, greyed as
// Notion's filter greys it.
function isAfterRange(day: string, props: DatePickerProps): boolean {
  const end = props.value?.end;
  return props.isShownOnly === true && end !== undefined && day > end;
}

// Which end of a range a chosen day is: the band runs between them.
function rangeEnd(day: string, props: DatePickerProps) {
  const { value } = props;
  if (value?.end === undefined || value.end === value.start) return nothing;
  if (day === value.start) return "start";
  return day === value.end ? "end" : nothing;
}

function renderDay(day: string, isInMonth: boolean, props: DatePickerProps) {
  const isChosen = day === props.value?.start || day === props.value?.end;
  return html`<button
    type="button"
    class="date-picker__day"
    data-day=${day}
    aria-label=${DAY.format(at(day))}
    aria-pressed=${String(isChosen)}
    ?data-today=${day === props.today}
    ?data-outside=${!isInMonth}
    ?data-in-range=${isInRange(day, props)}
    ?data-after=${isAfterRange(day, props)}
    data-range=${rangeEnd(day, props)}
    @click=${() => {
      props.onChange(chooseDay(props.value, day));
    }}
  >
    ${Number(day.slice(8))}
  </button>`;
}

export function renderDatePicker(props: DatePickerProps): TemplateResult {
  return html`<div
    class="date-picker"
    aria-label=${props.label}
    role="group"
    ?data-shown-only=${props.isShownOnly === true}
  >
    ${props.hasFields === false ? nothing : renderFields(props)}
    ${renderHeader(props)}
    <div class="date-picker__grid">
      ${TEXT.weekdays.map(
        (weekday) => html`<span class="date-picker__weekday">${weekday}</span>`,
      )}
      ${calendarDays(props.month).map(({ day, isInMonth }) =>
        renderDay(day, isInMonth, props),
      )}
    </div>
  </div>`;
}
