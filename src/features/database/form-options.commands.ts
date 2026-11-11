// What a form view asks: which questions must be answered, and the words
// above them. Saved with the view.
import type { FormOptions, ViewId } from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";

export const setFormOptions = defineCommand<{
  viewId: ViewId;
  options: Partial<FormOptions>;
}>({
  type: "view.setFormOptions",
  handle(state, command) {
    const view = state.workspace.views[command.viewId];
    if (view === undefined) return {};
    const form = { ...view.form, ...command.options };
    return {
      operations: [
        { type: "record.update", kind: "view", id: view.id, patch: { form } },
      ],
    };
  },
});

export const formOptionCommands = [setFormOptions];
