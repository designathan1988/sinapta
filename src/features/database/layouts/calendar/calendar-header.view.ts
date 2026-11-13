// What a calendar shows, named above it, with buttons to the month or
// week before and after it and back to the current one.
import { html, type TemplateResult } from "lit-html";
import type { Dispatch } from "../../../../state/index.ts";
import { renderButton } from "../../../../ui/button/index.ts";
import { COPY } from "../../../../ui/copy.ts";
import { setCalendarMonth, setCalendarWeek } from "./calendar.commands.ts";
import { addDays, shiftMonth } from "./calendar.selectors.ts";

const MONTH_NAME = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const WEEK_RANGE = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const WEEK_DAYS = 7;

export interface CalendarShown {
  readonly mode: "month" | "week";
  readonly month: string;
  // The first day of the week shown.
  readonly week: string;
}

function at(day: string): Date {
  return new Date(`${day}T00:00:00Z`);
}

interface Steps {
  readonly title: string;
  readonly previous: string;
  readonly next: string;
  readonly go: (by: number | null) => () => void;
}

function stepsOf(shown: CalendarShown, dispatch: Dispatch): Steps {
  const text = COPY.database;
  if (shown.mode === "week") {
    const last = addDays(shown.week, WEEK_DAYS - 1);
    return {
      title: WEEK_RANGE.formatRange(at(shown.week), at(last)),
      previous: text.previousWeek,
      next: text.nextWeek,
      go: (by) => () =>
        dispatch(
          setCalendarWeek.create({
            day: by === null ? null : addDays(shown.week, by * WEEK_DAYS),
          }),
        ),
    };
  }
  return {
    title: MONTH_NAME.format(at(`${shown.month}-01`)),
    previous: text.previousMonth,
    next: text.nextMonth,
    go: (by) => () =>
      dispatch(
        setCalendarMonth.create({
          month: by === null ? null : shiftMonth(shown.month, by),
        }),
      ),
  };
}

export function renderCalendarHeader(
  shown: CalendarShown,
  dispatch: Dispatch,
  manage: TemplateResult,
): TemplateResult {
  const steps = stepsOf(shown, dispatch);
  return html`<header class="calendar__header">
    <h2 class="calendar__month" aria-live="polite">${steps.title}</h2>
    ${manage}
    ${renderButton({
      label: steps.previous,
      icon: "back",
      isIconOnly: true,
      onClick: steps.go(-1),
    })}
    ${renderButton({ label: COPY.database.today, onClick: steps.go(null) })}
    ${renderButton({
      label: steps.next,
      icon: "chevron",
      isIconOnly: true,
      onClick: steps.go(1),
    })}
  </header>`;
}
