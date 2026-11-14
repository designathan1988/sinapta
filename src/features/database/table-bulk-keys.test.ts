// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command, Dispatch } from "../../state/index.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { renderDatabase } from "./database.view.ts";
import { selectRows } from "./row-bulk.commands.ts";

describe("selected rows", () => {
  it("are let go on Escape, as Notion's", () => {
    const app = createDatabaseApp([], [["one"], ["two"]]);
    const [first] = app.database().childIds;
    if (first === undefined) throw new Error("setup");
    app.dispatch(selectRows.create({ rowIds: [first] }));
    const sent: Command[] = [];
    const dispatch: Dispatch = (command) => {
      sent.push(command);
      return { ok: true };
    };
    const host = document.createElement("div");
    document.body.replaceChildren(host);
    render(renderDatabase(app.store.getState(), dispatch), host);
    const box = host.querySelector(".database__row input[type=checkbox]");

    box?.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      }),
    );

    expect(sent).toContainEqual(
      expect.objectContaining({ type: "ui.selectRows", rowIds: [] }),
    );
  });
});
