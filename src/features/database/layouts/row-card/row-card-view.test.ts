// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { ViewType } from "../../../../model/index.ts";
import { setCardOptions } from "../../card.commands.ts";
import { createDatabaseApp } from "../../database-builder.ts";
import { renderDatabase } from "../../database.view.ts";
import { setViewType } from "../../view-layout.commands.ts";

type CardLayout = "compact" | "list";

// The first card of a one-row database laid out as asked (its status
// groups a board), its cards set as asked.
function firstCard(type: ViewType, layout?: CardLayout, fitMedia?: boolean) {
  const app = createDatabaseApp(
    [
      { name: "Notes", type: "text" },
      { name: "Status", type: "status" },
    ],
    [["Ship", "soon"]],
  );
  const viewId = app.view().id;
  app.dispatch(setViewType.create({ viewId, viewType: type }));
  if (layout !== undefined) {
    const card = { layout, ...(fitMedia === true && { fitMedia }) };
    app.dispatch(setCardOptions.create({ viewId, options: { card } }));
  }
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    renderDatabase(app.store.getState(), () => ({ ok: true })),
    host,
  );
  return host.querySelector(".row-card");
}

describe("renderRowCard", () => {
  it("lays a card out as a list by default", () => {
    expect(firstCard("gallery")?.getAttribute("data-layout")).toBe("list");
  });

  it("lays a board's and a gallery's cards out as the view asks", () => {
    const board = firstCard("board", "compact");
    const gallery = firstCard("gallery", "compact", true);

    expect(board?.getAttribute("data-layout")).toBe("compact");
    expect(gallery?.getAttribute("data-layout")).toBe("compact");
    expect(gallery?.hasAttribute("data-fit")).toBe(true);
  });
});
