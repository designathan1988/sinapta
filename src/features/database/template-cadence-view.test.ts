// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command } from "../../state/index.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { presetDraft } from "./template-cadence.ts";
import { renderCadencePanel } from "./template-cadence.view.ts";
import { addTemplate } from "./template.commands.ts";

const TODAY = "2026-11-13";

// "Edit cadence" with a new weekly draft, starting tomorrow.
function rendered() {
  const app = createDatabaseApp([], []);
  app.dispatch(addTemplate.create({ databaseId: app.databaseId }));
  const templateId = app.database().props.templateIds[0];
  if (templateId === undefined) throw new Error("setup");
  const sent: Command[] = [];
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    renderCadencePanel({
      state: app.store.getState(),
      dispatch: (command) => {
        sent.push(command);
        return { ok: true };
      },
      templateId,
      draft: presetDraft("week", TODAY),
      today: TODAY,
    }),
    host,
  );
  const button = (label: string) =>
    [...host.querySelectorAll<HTMLElement>("button")].find(
      (each) =>
        each.textContent.trim() === label ||
        each.getAttribute("aria-label") === label,
    );
  return { host, sent, button, templateId };
}

describe("Edit cadence", () => {
  it("saves the cadence, from tomorrow on Mondays", () => {
    const { sent, button, templateId } = rendered();

    button("Save")?.click();

    expect(sent).toEqual([
      expect.objectContaining({
        type: "template.setRepeat",
        templateId,
        cadence: { every: "week", weekdays: [0], start: "2026-11-14" },
      }),
      expect.objectContaining({ type: "ui.closeOverlay" }),
    ]);
  });

  it("adds a weekday to the draft", () => {
    const { sent, button } = rendered();

    button("Tuesday")?.click();

    expect(sent[0]?.type).toBe("ui.setOverlayValues");
    expect(sent[0]?.values).toContain("weekdays=0,1");
  });

  it("asks to discard a new cadence on Escape", () => {
    const { host, sent } = rendered();

    host
      .querySelector(".cadence")
      ?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );

    expect(sent).toEqual([
      expect.objectContaining({
        type: "ui.setOverlayValues",
        name: "cadence-asking",
      }),
    ]);
  });

  it("stops the repeat on Cancel recurrence", () => {
    const { sent, button } = rendered();

    button("Cancel recurrence")?.click();

    expect(sent[0]).toMatchObject({
      type: "template.setRepeat",
      cadence: null,
    });
  });

  it("tells the next occurrence in Notion's words", () => {
    const { host } = rendered();
    const next = host.querySelector(".cadence__next")?.textContent ?? "";

    // Monday is three days on: "Next {dayOfTheWeek}", and around
    // midnight "{date} between 12–3 AM" (automations.recurrenceHelpers).
    expect(next).toContain("Next occurrence:");
    expect(next).toContain("Next Mon between 12–3 AM");
  });
});

describe("Edit cadence, once closed", () => {
  it("gives the focus back to its Repeat button", () => {
    for (const label of ["Save", "Cancel recurrence"]) {
      const { button } = rendered();
      const repeat = document.createElement("button");
      repeat.setAttribute("data-overlay-anchor", "");
      repeat.setAttribute("aria-expanded", "true");
      document.body.append(repeat);

      button(label)?.click();

      expect(document.activeElement).toBe(repeat);
    }
  });
});
