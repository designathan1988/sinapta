// A calendar: a month in weeks or a single week, with or without its
// weekends, each row on the days of its date property. Rows move between
// days by drag, or by Alt with an arrow key.
import { renderManageInCalendar } from "../../view-calendar-item.ts";
import { selectRowColor } from "../../row-color.selectors.ts";
import { withDefaultTemplate } from "../../template-default.commands.ts";
import { openRow } from "../../row-open.commands.ts";
import "./calendar.css";
import { html, nothing, type TemplateResult } from "lit-html";
import type { BlockId } from "../../../../model/index.ts";
import { renderButton } from "../../../../ui/button/index.ts";
import { COPY } from "../../../../ui/copy.ts";
import { startPointerDrag } from "../../../../ui/drag/index.ts";
import { whenConnected } from "../../../../ui/focus/index.ts";
import { addRow, setRowValue } from "../../row.commands.ts";
import type { TableContext } from "../../table-cell.view.ts";
import type { TableRow } from "../../table-model.selectors.ts";
import {
  renderCalendarHeader,
  type CalendarShown,
} from "./calendar-header.view.ts";
import { setCalendarMonth } from "./calendar.commands.ts";
import {
  addDays,
  monthOf,
  selectCalendarEntries,
  selectMonthWeeks,
  selectShownDays,
  selectWeekDays,
  shiftDateValue,
  type CalendarEntries,
} from "./calendar.selectors.ts";

interface CalendarContext extends TableContext {
  readonly entries: CalendarEntries;
  readonly shown: CalendarShown;
  readonly today: string;
}

const KEY_DAYS: Readonly<Record<string, number>> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -7,
  ArrowDown: 7,
};

const MINUTE_MS = 60_000;

const WEEKDAY = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  timeZone: "UTC",
});

// Today as a calendar date in the person's own time zone.
function localToday(): string {
  const now = new Date();
  const local = now.getTime() - now.getTimezoneOffset() * MINUTE_MS;
  return new Date(local).toISOString().slice(0, 10);
}

function weekdayName(day: string): string {
  return WEEKDAY.format(new Date(`${day}T00:00:00Z`));
}

// Focus follows the row to its new day, so the keys keep moving it.
function focusEntry(rowId: BlockId): void {
  const selector = `.calendar [data-row-id="${rowId}"]`;
  const entry = document.querySelector(selector);
  if (entry === null) return;
  whenConnected(entry, () => {
    document.querySelector<HTMLElement>(selector)?.focus();
  });
}

interface Move {
  readonly from: string;
  readonly to: string;
}

// Moves a row's date by the days between the day it was shown on and the
// day it goes to, so a range keeps its length.
function moveEntry(context: CalendarContext, rowId: BlockId, move: Move) {
  const { dispatch, entries } = context;
  const { month } = context.shown;
  const propertyId = context.model.database.props.properties.find(
    (item) => item.id === entries.propertyId,
  )?.id;
  const row = context.model.rows.find((item) => item.id === rowId);
  if (propertyId === undefined || row === undefined) return;
  const stored = row.values[propertyId];
  const value = shiftDateValue(stored, move.from, move.to);
  const day = move.to;
  dispatch(setRowValue.create({ rowId, propertyId, value }));
  if (monthOf(day) !== month)
    dispatch(setCalendarMonth.create({ month: monthOf(day) }));
  focusEntry(rowId);
}

function renderEntry(
  context: CalendarContext,
  row: TableRow,
  day: string,
): TemplateResult {
  const onKeyDown = (event: KeyboardEvent): void => {
    const days = KEY_DAYS[event.key];
    if (!event.altKey || days === undefined) return;
    event.preventDefault();
    moveEntry(context, row.id, { from: day, to: addDays(day, days) });
  };
  return html`<button
    type="button"
    class="calendar__entry"
    data-row-id=${row.id}
    data-color=${selectRowColor(context.model, row, context.state) ?? nothing}
    aria-description=${COPY.database.moveEntryHint}
    @click=${() => context.dispatch(openRow.create({ rowId: row.id, viewId: context.model.view.id }))}
    @keydown=${onKeyDown}
  >
    ${row.title === "" ? COPY.sidebar.untitled : row.title}
  </button>`;
}

function renderDay(context: CalendarContext, day: string): TemplateResult {
  const { entries, model, dispatch } = context;
  const rows = entries.byDay.get(day) ?? [];
  const databaseId = model.database.id;
  const values = { [entries.propertyId]: { start: day } };
  return html`<td
    class="calendar__day"
    data-day=${day}
    ?data-other-month=${context.shown.mode === "month" && monthOf(day) !== context.shown.month}
    ?data-today=${day === context.today}
  >
    <span class="calendar__date">${Number(day.slice(8))}</span>
    ${rows.map((row) => renderEntry(context, row, day))}
    <span class="calendar__add">
      ${renderButton({
        label: `${COPY.database.newOnDay} ${day}`,
        icon: "plus",
        isIconOnly: true,
        onClick: () =>
          dispatch(
            addRow.create(
              withDefaultTemplate(context.state, {
                databaseId,
                values,
                opensPage: true,
                viewId: context.model.view.id,
              }),
            ),
          ),
      })}
    </span>
  </td>`;
}

function startEntryDrag(event: PointerEvent, context: CalendarContext): void {
  startPointerDrag(event, {
    itemSelector: ".calendar__entry, .calendar__day",
    onDrop(source, target) {
      const row = context.model.rows.find(
        (item) => item.id === source.dataset.rowId,
      );
      const to = target.closest<HTMLElement>(".calendar__day")?.dataset.day;
      const from = source.closest<HTMLElement>(".calendar__day")?.dataset.day;
      if (row !== undefined && to !== undefined)
        moveEntry(context, row.id, { from: from ?? to, to });
    },
  });
}

// The weeks the calendar shows, each without its weekend when hidden.
function shownWeeks(context: CalendarContext): string[][] {
  const { calendar } = context.model.view;
  const { shown } = context;
  const weeks =
    shown.mode === "week"
      ? [selectWeekDays(shown.week, calendar.weekStartsOn)]
      : selectMonthWeeks(shown.month, calendar.weekStartsOn);
  return weeks.map((week) => selectShownDays(week, calendar.showWeekends));
}

function renderGrid(context: CalendarContext): TemplateResult {
  const weeks = shownWeeks(context);
  return html`<table
    class="calendar__grid"
    @pointerdown=${(event: PointerEvent) => {
      startEntryDrag(event, context);
    }}
  >
    <thead>
      <tr>
        ${(weeks[0] ?? []).map(
          (day) => html`<th scope="col">${weekdayName(day)}</th>`,
        )}
      </tr>
    </thead>
    <tbody>
      ${weeks.map(
        (week) =>
          html`<tr>
            ${week.map((day) => renderDay(context, day))}
          </tr>`,
      )}
    </tbody>
  </table>`;
}

export function renderCalendar(context: TableContext): TemplateResult {
  const entries = selectCalendarEntries(context.model);
  if (entries === undefined) {
    return html`<p class="calendar__empty">${COPY.database.noDateProperty}</p>`;
  }
  const today = localToday();
  const { ui } = context.state;
  const { mode, weekStartsOn, wrapTitles } = context.model.view.calendar;
  const week = selectWeekDays(ui.calendarWeek ?? today, weekStartsOn)[0];
  const shown = {
    mode,
    month: ui.calendarMonth ?? monthOf(today),
    week: week ?? today,
  };
  const calendar = { ...context, entries, shown, today };
  return html`<div
    class="calendar"
    data-mode=${mode}
    ?data-wrap=${wrapTitles === true}
  >
    ${renderCalendarHeader(shown, context.dispatch, renderManageInCalendar(context))}
    ${renderGrid(calendar)}
  </div>`;
}
