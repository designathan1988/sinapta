// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command, OverlayChild } from "../../state/index.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { COLUMN_MENU_OVERLAY } from "./database-overlay.ts";
import { renderDatabase } from "./database.view.ts";

// A text column's menu, signed in, with these submenus open.
function rendered(children: readonly string[] = []) {
  const app = createDatabaseApp([{ name: "Notes", type: "text" }], []);
  const [notes] = app.propertyIds;
  if (notes === undefined) throw new Error("setup");
  const built = app.store.getState();
  const open: OverlayChild[] = children.map((child) => ({
    anchorId: child.replace("{id}", notes),
  }));
  const overlay = {
    kind: COLUMN_MENU_OVERLAY,
    anchorId: notes,
    ...(open.length > 0 && { children: open }),
  };
  const user = {
    id: "u1",
    email: "ada@pagecraft.test",
    name: "Ada",
    photo: null,
  };
  const account = { ...built.persistence.account, user };
  const state = {
    ...built,
    persistence: { ...built.persistence, account },
    ui: { ...built.ui, overlay },
  };
  const sent: Command[] = [];
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    renderDatabase(state, (command) => {
      sent.push(command);
      return { ok: true };
    }),
    host,
  );
  const menus = () => [...host.querySelectorAll<HTMLElement>(".menu")];
  const labels = (depth = 0) =>
    [...(menus()[depth]?.querySelectorAll<HTMLElement>("[data-index]") ?? [])]
      .filter((row) => row.closest(".menu") === menus()[depth])
      .map((row) => row.querySelector(".menu__label")?.textContent.trim());
  return { host, sent, labels, notes, menus };
}

describe("a text column's AI autofill, as Notion's", () => {
  it("sits after Change type as one row that opens its kinds", () => {
    const { labels } = rendered();

    expect(labels().slice(0, 3)).toEqual([
      "Edit property",
      "Change type",
      "AI autofill",
    ]);
  });

  it("fills the column with a summary from its list", () => {
    const { labels, menus, sent, notes } = rendered(["{id}:ai-fill"]);

    expect(labels(1)).toEqual(["Summary", "Key info", "Translation"]);
    [...(menus()[1]?.querySelectorAll<HTMLElement>("[data-index]") ?? [])]
      .find((row) => row.textContent.includes("Summary"))
      ?.click();

    const asked = sent.find((command) => command.type === "sync.request");

    expect(asked).toMatchObject({
      request: { kind: "ai-fill", propertyId: notes, action: "summarize" },
    });
  });
});
