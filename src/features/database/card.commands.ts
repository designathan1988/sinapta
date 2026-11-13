// How a board or a gallery shows its cards: their size, the picture
// above the title, on a board whether columns are tinted, and the card
// layout (compact or list) and whether pictures fit whole.
import {
  DEFAULT_CARD_OPTIONS,
  type CardOptions as CardLayout,
  type View,
  type ViewId,
} from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";

export type CardOptions = Partial<
  Pick<View, "cardSize" | "cardPreview" | "colorColumns">
> & { readonly card?: Partial<CardLayout> };

export const setCardOptions = defineCommand<{
  viewId: ViewId;
  options: CardOptions;
}>({
  type: "view.setCardOptions",
  handle(state, command) {
    const view = state.workspace.views[command.viewId];
    if (view === undefined) return {};
    const { card, ...rest } = command.options;
    const patch =
      card === undefined
        ? rest
        : {
            ...rest,
            card: { ...(view.card ?? DEFAULT_CARD_OPTIONS), ...card },
          };
    return {
      operations: [{ type: "record.update", kind: "view", id: view.id, patch }],
    };
  },
});

export const cardCommands = [setCardOptions];
