// How a board or a gallery shows its cards: their size, the picture
// above the title and, on a board, whether columns are tinted.
import type { View, ViewId } from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";

export type CardOptions = Partial<
  Pick<View, "cardSize" | "cardPreview" | "colorColumns">
>;

export const setCardOptions = defineCommand<{
  viewId: ViewId;
  options: CardOptions;
}>({
  type: "view.setCardOptions",
  handle(state, command) {
    const view = state.workspace.views[command.viewId];
    if (view === undefined) return {};
    const patch = { ...command.options };
    return {
      operations: [{ type: "record.update", kind: "view", id: view.id, patch }],
    };
  },
});

export const cardCommands = [setCardOptions];
