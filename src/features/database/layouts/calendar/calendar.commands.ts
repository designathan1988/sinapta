// The month calendar views show. Interface state only: not saved with the
// workspace and not undone.
import { defineCommand } from "../../../../state/index.ts";

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

export const setCalendarMonth = defineCommand<{ month: string | null }>({
  type: "calendar.setMonth",
  handle(state, command) {
    const { month } = command;
    if (month !== null && !MONTH.test(month)) return {};
    return { ui: { ...state.ui, calendarMonth: month } };
  },
});

export const calendarCommands = [setCalendarMonth];
