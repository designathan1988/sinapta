// How a calendar view shows its days: by month or by week, with or
// without weekends, its weeks from Sunday or Monday. Saved with the view.
import type { CalendarOptions, ViewId } from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";

export const setCalendarOptions = defineCommand<{
  viewId: ViewId;
  options: Partial<CalendarOptions>;
}>({
  type: "view.setCalendarOptions",
  handle(state, command) {
    const view = state.workspace.views[command.viewId];
    if (view === undefined) return {};
    const calendar = { ...view.calendar, ...command.options };
    return {
      operations: [
        {
          type: "record.update",
          kind: "view",
          id: view.id,
          patch: { calendar },
        },
      ],
    };
  },
});

export const calendarOptionCommands = [setCalendarOptions];
