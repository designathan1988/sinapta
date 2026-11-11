// The month and the week a calendar shows: interface state, not saved and
// not undone. Its options belong to the view (calendar-options.commands).
import { defineCommand } from "../../../../state/index.ts";

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const DAY = /^\d{4}-(0[1-9]|1[0-2])-\d{2}$/;

export const setCalendarMonth = defineCommand<{ month: string | null }>({
  type: "calendar.setMonth",
  handle(state, command) {
    const { month } = command;
    if (month !== null && !MONTH.test(month)) return {};
    return { ui: { ...state.ui, calendarMonth: month } };
  },
});

// The week a calendar shows in week mode, by its first day.
export const setCalendarWeek = defineCommand<{ day: string | null }>({
  type: "calendar.setWeek",
  handle(state, command) {
    const { day } = command;
    if (day !== null && !DAY.test(day)) return {};
    return { ui: { ...state.ui, calendarWeek: day } };
  },
});

export const calendarCommands = [setCalendarMonth, setCalendarWeek];
