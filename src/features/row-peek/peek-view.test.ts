// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it, vi } from "vitest";
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
  return { host, sent, button, first };
}

describe("the row peek view", () => {
  it("gives the focus back to its row when it closes", () => {
    const { host, first, button } = rendered();
    const row = document.createElement("button");
    row.dataset.rowId = first;
    document.body.append(row);

    host
      .querySelector(".peek")
      ?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    expect(document.activeElement).toBe(row);

    button(COPY.peek.next)?.focus();
    button(COPY.peek.close)?.click();
    expect(document.activeElement).toBe(row);
  });

  it("takes the focus when it opens, so its keys work at once", async () => {
    const { host } = rendered();
    await Promise.resolve();

    expect(document.activeElement).toBe(host.querySelector(".peek"));
  });

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

  it("closes on Escape from the page's title, which has no block to select", () => {
    const { host, sent } = rendered();
    const event = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
    });

    host.querySelector(".peek .editor__title")?.dispatchEvent(event);

    expect(sent.at(-1)?.type).toBe("peek.close");
  });

  it("comments on its page, copies its link and favors it from its bar", () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    const { sent, button, first } = rendered();

    button(COPY.peek.comment)?.click();
    button(COPY.peek.copyLink)?.click();
    button(COPY.peek.favorite)?.click();

    expect(sent).toEqual([
      expect.objectContaining({
        type: "ui.openOverlay",
        overlay: { kind: "comment-composer", anchorId: first },
      }),
      expect.objectContaining({ type: "page.toggleFavorite", pageId: first }),
    ]);
    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining(`#/page/${first}`),
    );
    expect(button(COPY.peek.favorite)?.getAttribute("aria-pressed")).toBe(
      "false",
    );
  });

  it("widens and narrows a side peek from its edge by keyboard", () => {
    const { host, sent } = rendered();
    const edge = host.querySelector<HTMLElement>(".peek__resizer");

    expect(edge?.getAttribute("role")).toBe("separator");
    expect(edge?.getAttribute("aria-valuenow")).toBe("40");
    for (const key of ["ArrowLeft", "ArrowRight", "End"]) {
      edge?.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
    }

    expect(
      sent.map((command) => ("width" in command ? command.width : null)),
    ).toEqual([41, 39, 60]);
  });
});
