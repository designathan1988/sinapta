// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command } from "../../../../state/index.ts";
import { createDatabaseApp } from "../../database-builder.ts";
import { renderButtonPropertyConfig } from "./button-property-config.view.ts";

describe("a button property's settings", () => {
  it("opens Edit automation with the button's config", () => {
    const app = createDatabaseApp([{ name: "Go", type: "button" }], []);
    const property = app.database().props.properties[0];
    if (property === undefined) throw new Error("no property");
    const sent: Command[] = [];
    const host = document.createElement("div");
    document.body.replaceChildren(host);
    render(
      renderButtonPropertyConfig(property, () => undefined, {
        databaseId: app.databaseId,
        state: app.store.getState(),
        dispatch: (command) => {
          sent.push(command);
          return { ok: true };
        },
      }),
      host,
    );

    host.querySelector<HTMLElement>(".database__switch-row")?.click();

    expect(sent.map((command) => command.type)).toEqual([
      "ui.openOverlay",
      "ui.setOverlayDraft",
    ]);
  });
});
