// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command } from "../../state/index.ts";
import { BUTTON_CONFIRM_OVERLAY } from "./button-press.view.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { setPropertyConfig } from "./database.commands.ts";
import { renderDatabase } from "./database.view.ts";

// A row with a "Go" button that asks "Sure?" first, its question open.
function askingButton() {
  const app = createDatabaseApp([{ name: "Go", type: "button" }], [["A"]]);
  const [go] = app.propertyIds;
  const [rowId] = app.rowIds;
  if (go === undefined || rowId === undefined) throw new Error("setup");
  const actions = [{ kind: "confirm", message: "Sure?" }];
  app.dispatch(
    setPropertyConfig.create({
      databaseId: app.databaseId,
      propertyId: go,
      config: { label: "Go", actions },
    }),
  );
  const built = app.store.getState();
  const overlay = { kind: BUTTON_CONFIRM_OVERLAY, anchorId: `${rowId}:${go}` };
  const sent: Command[] = [];
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    renderDatabase({ ...built, ui: { ...built.ui, overlay } }, (command) => {
      sent.push(command);
      return { ok: true };
    }),
    host,
  );
  const press = (label: string) =>
    [...host.querySelectorAll<HTMLElement>("button")]
      .find((each) => each.textContent.trim() === label)
      ?.click();
  return { host, sent, press };
}

describe("a button that asks first", () => {
  it("shows its question", () => {
    const { host } = askingButton();
    expect(host.querySelector(".confirm")?.textContent).toContain("Sure?");
  });

  it("runs its actions once its question is answered", () => {
    const { sent, press } = askingButton();
    press("Continue");
    expect(sent.map((command) => command.type)).toContain("row.pressButton");
  });

  it("runs nothing when its question is cancelled", () => {
    const { sent, press } = askingButton();
    press("Cancel");
    expect(sent.map((command) => command.type)).not.toContain(
      "row.pressButton",
    );
  });
});
