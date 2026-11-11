// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { openRow } from "../database/index.ts";
import { createPeekApp } from "./peek-builder.ts";
import { renderPeek } from "./peek.view.ts";

// Two rows, the first open in a side peek.
function rendered() {
  const app = createPeekApp(["One", "Two"]);
  const [first] = app.rowIds;
  if (first === undefined) throw new Error("setup");
  app.dispatch(openRow.create({ rowId: first, viewId: app.viewId }));
  const sent: Command[] = [];
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    renderPeek(app.store.getState(), (command) => {
      sent.push(command);
      return { ok: true };
    }),
    host,
  );
  const button = (label: string) =>
    host.querySelector<HTMLElement>(`button[aria-label="${label}"]`);
  return { host, sent, button };
}

describe("the row peek view", () => {
  it("shows the peeked row's page", () => {
    const { host } = rendered();

    expect(
      host.querySelector<HTMLTextAreaElement>(".editor__title")?.value,
    ).toBe("One");
  });

  it("closes, opens as a page and steps on from its bar", () => {
    const { sent, button } = rendered();

    button(COPY.peek.close)?.click();
    button(COPY.peek.expand)?.click();
    button(COPY.peek.next)?.click();

    expect(sent.map((command) => command.type)).toEqual([
      "peek.close",
      "peek.expand",
      "peek.step",
    ]);
  });

  it("does not step before the first row", () => {
    const { sent, button } = rendered();

    button(COPY.peek.previous)?.click();

    expect(sent).toEqual([]);
  });

  it("closes on Escape outside a field", () => {
    const { host, sent } = rendered();
    const event = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
    });

    host.querySelector(".peek__bar")?.dispatchEvent(event);

    expect(sent.at(-1)?.type).toBe("peek.close");
  });
});
