// The month a calendar shows, with buttons to the month before and after
// and back to the current one.
import { html, type TemplateResult } from "lit-html";
import type { Dispatch } from "../../../../state/index.ts";
import { renderButton } from "../../../../ui/button/index.ts";
import { COPY } from "../../../../ui/copy.ts";
import { setCalendarMonth } from "./calendar.commands.ts";
import { shiftMonth } from "./calendar.selectors.ts";

const MONTH_NAME = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function renderCalendarHeader(
  month: string,
  dispatch: Dispatch,
): TemplateResult {
  const go = (next: string | null) => () =>
    dispatch(setCalendarMonth.create({ month: next }));
  return html`<header class="calendar__header">
    <h2 class="calendar__month" aria-live="polite">
      ${MONTH_NAME.format(new Date(`${month}-01T00:00:00Z`))}
    </h2>
    ${renderButton({
      label: COPY.database.previousMonth,
      icon: "back",
      isIconOnly: true,
      onClick: go(shiftMonth(month, -1)),
    })}
    ${renderButton({ label: COPY.database.today, onClick: go(null) })}
    ${renderButton({
      label: COPY.database.nextMonth,
      icon: "chevron",
      isIconOnly: true,
      onClick: go(shiftMonth(month, 1)),
    })}
  </header>`;
}
