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

// A chosen day as a field: a day typed into it, as "Dec 3" or
// "12/3/2026", takes its place on Enter; text that is no day is put back.
function renderDayField(
  props: DatePickerProps,
  value: DateRangeValue,
  isEnd: boolean,
): TemplateResult {
  const day = isEnd ? (value.end ?? value.start) : value.start;
  const onDay = (event: Event): void => {
    event.stopPropagation();
    if (!(event.target instanceof HTMLInputElement)) return;
    const typed = parseTypedDate(event.target.value, props.today);
    if (typed === undefined) {
      event.target.value = SHORT.format(at(day));
      return;
    }
    props.onChange(withDay(value, typed, isEnd));
  };
  return html`<input
    class="date-picker__field"
    type="text"
    autocomplete="off"
    aria-label=${isEnd ? TEXT.endDate : TEXT.startDate}
    .value=${SHORT.format(at(day))}
    @change=${onDay}
  />`;
}

// The chosen days as fields, and the time's own field when it has one.
function renderFields(props: DatePickerProps): TemplateResult {
  const { value } = props;
  // The time's change is the picker's own: no form around it reads it.
  const onTime = (event: Event): void => {
    event.stopPropagation();
    if (!(event.target instanceof HTMLInputElement) || value === undefined)
      return;
    const time = event.target.value;
    props.onChange(time === "" ? { ...value } : { ...value, time });
  };
  return html`<div class="date-picker__fields">
    ${value === undefined ? nothing : renderDayField(props, value, false)}
    ${value?.end === undefined ? nothing : renderDayField(props, value, true)}
    ${
      value?.time === undefined
        ? nothing
        : html`<input
            class="date-picker__field"
            type="time"
            aria-label=${TEXT.time}
            .value=${value.time}
            @change=${onTime}
          />`
    }
  </div>`;
}

function renderHeader(props: DatePickerProps): TemplateResult {
  const arrow = (
    label: string,
    icon: "arrow-left" | "arrow-right",
    by: number,
  ) =>
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
    <button
      type="button"
      class="date-picker__today"
      aria-label=${TEXT.today}
      @click=${() => {
        props.onMonth(monthOf(props.today));
      }}
    >
      ${TEXT.today}
    </button>
    ${arrow(TEXT.previousMonth, "arrow-left", -1)}
    ${arrow(TEXT.nextMonth, "arrow-right", 1)}
  </div>`;
}

function isInRange(day: string, props: DatePickerProps): boolean {
  const { value } = props;
  return value?.end !== undefined && day > value.start && day < value.end;
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
    @click=${() => {
      props.onChange(chooseDay(props.value, day));
    }}
  >
    ${Number(day.slice(8))}
  </button>`;
}

export function renderDatePicker(props: DatePickerProps): TemplateResult {
  return html`<div class="date-picker" aria-label=${props.label} role="group">
    ${renderFields(props)} ${renderHeader(props)}
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
