// How a timeline view shows its rows: by which date property, at which
// zoom, and whether the table of rows sits beside it. Saved with the view.
import type { TimelineOptions, ViewId } from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";

export const setTimelineOptions = defineCommand<{
  viewId: ViewId;
  options: Partial<TimelineOptions>;
}>({
  type: "view.setTimelineOptions",
  handle(state, command) {
    const view = state.workspace.views[command.viewId];
    if (view === undefined) return {};
    const timeline = { ...view.timeline, ...command.options };
    return {
      operations: [
        {
          type: "record.update",
          kind: "view",
          id: view.id,
          patch: { timeline },
        },
      ],
    };
  },
});

export const timelineOptionCommands = [setTimelineOptions];
