// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { createDatabaseApp } from "../../database-builder.ts";
import { renderButtonPropertyConfig } from "./button-property-config.view.ts";

describe("a button property's settings", () => {
  it("turns opening the row on with a switch, as Notion's", () => {
    const app = createDatabaseApp([{ name: "Go", type: "button" }], []);
    const property = app.database().props.properties[0];
    if (property === undefined) throw new Error("no property");
    const changes: unknown[] = [];
    const host = document.createElement("div");
    document.body.replaceChildren(host);
    render(
      renderButtonPropertyConfig(property, (config) => changes.push(config), {
        databaseId: app.databaseId,
        state: app.store.getState(),
        dispatch: () => ({ ok: true }),
      }),
      host,
    );
    const toggle = host.querySelector<HTMLElement>('[role="switch"]');

    toggle?.click();

    expect(toggle?.getAttribute("aria-checked")).toBe("false");
    expect(changes).toEqual([
      expect.objectContaining({ actions: [{ kind: "open-page" }] }),
    ]);
  });
});
