// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { createInitialState } from "../../state/index.ts";
import { renderConnections } from "./connections-settings.view.ts";

describe("Notion's app connections", () => {
  it("are drawn and say that this server cannot turn them on", () => {
    const host = document.createElement("div");
    render(
      renderConnections(createInitialState(), () => ({ ok: true })),
      host,
    );

    const apps = [...host.querySelectorAll(".integrations__apps > li")];
    expect(
      apps.map((app) => app.querySelector(".settings__name")?.textContent),
    ).toEqual(["Slack", "Google Drive", "GitHub", "Jira", "Figma", "Asana"]);
    expect(
      apps.every((app) => app.querySelector("button")?.disabled === true),
    ).toBe(true);
    expect(host.textContent).toContain("Needs Notion's servers");
  });
});
