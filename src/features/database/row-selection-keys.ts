// Escape lets go of the selected rows, as Notion's, wherever the focus is:
// a row's box hides when the pointer leaves it, and the focus with it.
import type { ScopedKeys } from "../../ui/shortcuts/index.ts";
import { selectRows } from "./row-bulk.commands.ts";

export const rowSelectionKeys: ScopedKeys = {
  isActive: (state) =>
    state.ui.selectedRowIds.length > 0 && state.ui.overlay === null,
  keys: {
    Escape: ({ dispatch }) => {
      dispatch(selectRows.create({ rowIds: [] }));
    },
  },
};
