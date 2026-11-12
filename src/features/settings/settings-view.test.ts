// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import {
  createInitialState,
  requestExport,
  type Command,
} from "../../state/index.ts";
import { renderSettings, SETTINGS_OVERLAY } from "./settings.view.ts";

// Settings open at one of their sections.
function rendered(section?: string) {
  const initial = createInitialState();
  const overlay = {
    kind: SETTINGS_OVERLAY,
    ...(section !== undefined && { anchorId: section }),
  };
  const state = { ...initial, ui: { ...initial.ui, overlay } };
  const sent: Command[] = [];
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    renderSettings(state, (command) => {
      sent.push(command);
      return { ok: true };
    }),
    host,
  );
  const sections = [
    ...host.querySelectorAll<HTMLElement>(".settings__section"),
  ];
  return { host, sent, sections };
}

describe("settings, as Notion's", () => {
  it("lists their sections beside the open one, Preferences first", () => {
    const { host, sections } = rendered();

    expect(sections.map((item) => item.textContent.trim())).toEqual([
      "Preferences",
      "Import and export",
    ]);
    expect(sections[0]?.getAttribute("aria-current")).toBe("page");
    expect(host.querySelector(".settings__title")?.textContent.trim()).toBe(
      "Preferences",
    );
  });

  it("opens another section from the list", () => {
    const { sections, sent } = rendered();

    sections[1]?.click();

    expect(sent).toContainEqual(
      expect.objectContaining({
        type: "ui.openOverlay",
        overlay: { kind: SETTINGS_OVERLAY, anchorId: "data" },
      }),
    );
  });

  it("chooses the appearance from a menu at the end of its row", () => {
    const row = rendered().host.querySelector(".settings__row");

    expect(row?.querySelector(".settings__name")?.textContent.trim()).toBe(
      "Appearance",
    );
    expect(row?.querySelector(".select")?.textContent).toContain(
      "Use system setting",
    );
  });

  it("exports the workspace from its row", () => {
    const { host, sent } = rendered("data");
    const exportButton = [...host.querySelectorAll("button")].find(
      (button) => button.textContent.trim() === "Export",
    );

    exportButton?.click();

    expect(sent).toContainEqual(
      expect.objectContaining({ type: requestExport.create({}).type }),
    );
  });
});
