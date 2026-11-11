// What a chart view shows: its kind, the property it groups by, and what
// it measures. Saved with the view.
import type { ChartOptions, ViewId } from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";

export const setChartOptions = defineCommand<{
  viewId: ViewId;
  options: Partial<ChartOptions>;
}>({
  type: "view.setChartOptions",
  handle(state, command) {
    const view = state.workspace.views[command.viewId];
    if (view === undefined) return {};
    const chart = { ...view.chart, ...command.options };
    return {
      operations: [
        { type: "record.update", kind: "view", id: view.id, patch: { chart } },
      ],
    };
  },
});

export const chartOptionCommands = [setChartOptions];
