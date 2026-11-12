// The window's width, as the app learns it from the browser: a narrow
// window shows the sidebar as a drawer, closed until it is asked for.
import { defineCommand } from "./command-registry.ts";

export const setNarrow = defineCommand<{ isNarrow: boolean }>({
  type: "ui.setNarrow",
  handle: ({ ui }, { isNarrow }) =>
    ui.isNarrow === isNarrow
      ? {}
      : { ui: { ...ui, isNarrow, isDrawerOpen: false } },
});
