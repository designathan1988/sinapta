// A calendar: the month in weeks, each row on the day of its date
// property. Rows move between days by drag, or by Alt with an arrow key.
import "./calendar.css";
import { html, type TemplateResult } from "lit-html";
import type { BlockId } from "../../../../model/index.ts";
import { setActivePage } from "../../../../state/index.ts";
import { renderButton } from "../../../../ui/button/index.ts";
import { COPY } from "../../../../ui/copy.ts";
import { startPointerDrag } from "../../../../ui/drag/index.ts";
import { whenConnected } from "../../../../ui/focus/index.ts";
import { addRow, setRowValue } from "../../row.commands.ts";
import type { TableContext } from "../../table-cell.view.ts";
import type { TableRow } from "../../table-model.selectors.ts";
import { renderCalendarHeader } from "./calendar-header.view.ts";
import { setCalendarMonth } from "./calendar.commands.ts";
import {
  addDays,
  monthOf,
  selectCalendarEntries,
  selectMonthWeeks,
  shiftDateValue,
  type CalendarEntries,
} from "./calendar.selectors.ts";

interface CalendarContext extends TableContext {
  readonly entries: CalendarEntries;
  readonly month: string;
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
  const { dispatch, entries, month } = context;
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
    aria-description=${COPY.database.moveEntryHint}
    @click=${() => context.dispatch(setActivePage.create({ pageId: row.id }))}
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
    ?data-other-month=${monthOf(day) !== context.month}
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
          dispatch(addRow.create({ databaseId, values, opensPage: true })),
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

function renderGrid(context: CalendarContext): TemplateResult {
  const weeks = selectMonthWeeks(context.month);
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
  const month = context.state.ui.calendarMonth ?? monthOf(today);
  const calendar = { ...context, entries, month, today };
  return html`<div class="calendar">
    ${renderCalendarHeader(month, context.dispatch)} ${renderGrid(calendar)}
  </div>`;
}
