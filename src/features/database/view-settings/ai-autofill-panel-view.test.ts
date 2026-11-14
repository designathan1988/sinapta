// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command, OpenOverlay } from "../../../state/index.ts";
import { createDatabaseApp } from "../database-builder.ts";
import { renderDatabase } from "../database.view.ts";
import { VIEW_SETTINGS_OVERLAY } from "./view-settings.view.ts";

// The view settings on their AI Autofill panel, signed in or not.
function rendered(isSignedIn: boolean) {
  const app = createDatabaseApp([{ name: "Notes", type: "text" }], []);
  const [notes] = app.propertyIds;
  if (notes === undefined) throw new Error("setup");
  const built = app.store.getState();
  const user = {
    id: "u1",
    email: "ada@pagecraft.test",
    name: "Ada",
    photo: null,
  };
  const account = {
    ...built.persistence.account,
    user: isSignedIn ? user : null,
  };
  const overlay: OpenOverlay = {
    kind: VIEW_SETTINGS_OVERLAY,
    anchorId: app.databaseId,
    panel: "ai-autofill",
  };
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
  return { host, sent, notes };
}

describe("the view settings' AI Autofill, as Notion's", () => {
  it("fills a text column with the kind chosen under its name", () => {
    const { host, sent, notes } = rendered(true);
    const summary = [
      ...host.querySelectorAll<HTMLElement>("[data-index]"),
    ].find((row) => row.textContent.includes("Summary"));

    summary?.click();

    expect(host.textContent).toContain("Notes");
    const asked = sent.find((command) => command.type === "sync.request");
    expect(asked).toMatchObject({
      request: { kind: "ai-fill", propertyId: notes, action: "summarize" },
    });
  });

  it("says what it does, with nothing to choose while signed out", () => {
    const { host } = rendered(false);

    expect(host.textContent).toContain("Autofill properties with context");
    expect(host.textContent).not.toContain("Summary");
  });
});
