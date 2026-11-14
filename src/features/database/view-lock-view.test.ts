// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { createDatabaseApp } from "./database-builder.ts";
import { renderDatabase } from "./database.view.ts";
import { setViewLocked } from "./view-lock.commands.ts";

function rendered(isLocked: boolean) {
  const app = createDatabaseApp(
    [{ name: "Points", type: "number" }],
    [["one", 1]],
  );
  app.dispatch(setViewLocked.create({ viewId: app.view().id, isLocked }));
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(renderDatabase(app.store.getState(), app.dispatch), host);
  return host;
}

describe("a locked view, as Notion shows it", () => {
  it("marks its tab with a lock and offers no new property", () => {
    const host = rendered(true);

    expect(
      host.querySelector(".database__tab .database__tab-lock"),
    ).not.toBeNull();
    expect(host.querySelector(".database__add-property")).toBeNull();
  });

  it("shows neither once unlocked", () => {
    const host = rendered(false);

    expect(host.querySelector(".database__tab-lock")).toBeNull();
    expect(host.querySelector(".database__add-property")).not.toBeNull();
  });
});
