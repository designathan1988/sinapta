// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import type { Command } from "../../state/index.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { selectRows } from "./row-bulk.commands.ts";
import { rowSelectionKeys } from "./row-selection-keys.ts";

describe("Escape with rows selected", () => {
  it("lets go of them wherever the focus is, as Notion's", () => {
    const app = createDatabaseApp([], [["one"]]);
    const [first] = app.database().childIds;
    if (first === undefined) throw new Error("setup");
    app.dispatch(selectRows.create({ rowIds: [first] }));
    const state = app.store.getState();
    const sent: Command[] = [];

    expect(rowSelectionKeys.isActive(state)).toBe(true);
    rowSelectionKeys.keys.Escape?.({
      state,
      dispatch: (command) => {
        sent.push(command);
        return { ok: true };
      },
      event: new KeyboardEvent("keydown", { key: "Escape" }),
    });

    expect(sent).toEqual([
      expect.objectContaining({ type: "ui.selectRows", rowIds: [] }),
    ]);
  });

  it("does nothing with none selected", () => {
    const app = createDatabaseApp([], [["one"]]);

    expect(rowSelectionKeys.isActive(app.store.getState())).toBe(false);
  });
});
