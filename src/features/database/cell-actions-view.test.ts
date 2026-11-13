// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command, Dispatch } from "../../state/index.ts";
import { commentCommands, startDiscussion } from "../comments/index.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { renderDatabase } from "./database.view.ts";

function rendered(withDiscussion = false) {
  const app = createDatabaseApp(
    [{ name: "Amount", type: "number" }],
    [["Salary", 3500]],
    { commands: commentCommands },
  );
  const [rowId] = app.rowIds;
  const [amount] = app.propertyIds;
  if (rowId === undefined || amount === undefined) throw new Error("setup");
  if (withDiscussion) {
    app.dispatch(
      startDiscussion.create({
        pageId: rowId,
        blockId: null,
        value: { propertyId: amount, quote: "3500" },
        text: "Gross?",
      }),
    );
  }
  const sent: Command[] = [];
  const dispatch: Dispatch = (command) => {
    sent.push(command);
    return { ok: true };
  };
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(renderDatabase(app.store.getState(), dispatch), host);
  const cell = host.querySelector(`[data-cell="${rowId}:${amount}"]`);
  const button = (label: string) =>
    cell?.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`);
  return { host, sent, rowId, amount, cell, button };
}

describe("a value cell's bar", () => {
  it("opens the comment composer on the cell, and nothing else", () => {
    const { sent, rowId, amount, button } = rendered();

    button("Comment on property value")?.click();

    expect(sent).toEqual([
      expect.objectContaining({
        type: "ui.openOverlay",
        overlay: {
          kind: "value-comment-composer",
          anchorId: `${rowId}:${amount}`,
        },
      }),
    ]);
  });

  it("opens the value's discussions once it has one", () => {
    const { sent, button } = rendered(true);

    button("Open discussion")?.click();

    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({
      type: "ui.openOverlay",
      overlay: { kind: "value-discussions" },
    });
  });

  it("is not drawn in the title cell", () => {
    const { host, rowId } = rendered();

    const title = host.querySelector(`[data-cell="${rowId}:title"]`);

    expect(title?.querySelector("[data-cell-actions]")).toBeNull();
  });
});
