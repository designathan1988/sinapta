// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command, OpenOverlay } from "../../state/index.ts";
import {
  BUTTON_AUTOMATION_OVERLAY,
  NEW_ACTION_LIST,
} from "./button-automation.ts";
import { BUTTON_CONFIRM_OVERLAY } from "./button-press.view.ts";
import { COLUMN_MENU_OVERLAY } from "./database-overlay.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { setPropertyConfig } from "./database.commands.ts";
import { renderDatabase } from "./database.view.ts";

// A database with a Done checkbox and a "Go" button, the given overlay
// open.
function rendered(overlayOf: (button: string) => OpenOverlay | null) {
  const app = createDatabaseApp(
    [
      { name: "Done", type: "checkbox" },
      { name: "Go", type: "button" },
    ],
    [["A"]],
  );
  const [done, go] = app.propertyIds;
  const [rowId] = app.rowIds;
  if (done === undefined || go === undefined || rowId === undefined)
    throw new Error("setup");
  const built = app.store.getState();
  const state = { ...built, ui: { ...built.ui, overlay: overlayOf(go) } };
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
  const labels = (selector: string) =>
    [...document.querySelectorAll<HTMLElement>(selector)].map((each) =>
      each.textContent.trim(),
    );
  const press = (label: string) =>
    [...document.querySelectorAll<HTMLElement>("button, [role^=menuitem]")]
      .find((each) => each.textContent.trim() === label)
      ?.click();
  return { app, sent, labels, press, done, go, rowId };
}

const DRAFT = { label: "Go", actions: [] };

describe("a button's column menu", () => {
  it("offers Notion's items, and opens the automation with its config", () => {
    const { sent, labels, press, go } = rendered((button) => ({
      kind: COLUMN_MENU_OVERLAY,
      anchorId: button,
    }));

    press("Edit automation");

    expect(labels("[role^=menuitem]")).toEqual([
      "Edit automation",
      "Change type",
      "Freeze",
      "Hide",
      "Insert left",
      "Insert right",
      "Duplicate property",
      "Delete property",
    ]);
    expect(sent.map((command) => command.type)).toEqual([
      "ui.openOverlay",
      "ui.setOverlayDraft",
    ]);
    expect(sent[0]).toMatchObject({
      overlay: { kind: BUTTON_AUTOMATION_OVERLAY, anchorId: go },
    });
  });
});

describe("Edit automation", () => {
  it("adds an action from New action", () => {
    const { sent, press } = rendered((button) => ({
      kind: BUTTON_AUTOMATION_OVERLAY,
      anchorId: button,
      draft: DRAFT,
      children: [{ anchorId: NEW_ACTION_LIST }],
    }));

    press("Edit property…");

    expect(sent.at(-1)).toMatchObject({
      type: "ui.setOverlayDraft",
      draft: { label: "Go", actions: [{ kind: "set-values", values: {} }] },
    });
  });

  it("keeps the draft as the button's config on Save", () => {
    const draft = {
      label: "Go",
      actions: [{ kind: "confirm", message: "Sure?" }],
    };
    const { sent, press, go } = rendered((button) => ({
      kind: BUTTON_AUTOMATION_OVERLAY,
      anchorId: button,
      draft,
    }));

    press("Save");

    expect(sent[0]).toMatchObject({
      type: "property.setConfig",
      propertyId: go,
      config: draft,
    });
  });
});

describe("a button that asks first", () => {
  it("runs its actions once its question is answered", () => {
    const { app, sent, press, go, rowId } = rendered(() => null);
    app.dispatch(
      setPropertyConfig.create({
        databaseId: app.databaseId,
        propertyId: go,
        config: {
          label: "Go",
          actions: [{ kind: "confirm", message: "Sure?" }],
        },
      }),
    );
    const state = app.store.getState();
    const overlay = {
      kind: BUTTON_CONFIRM_OVERLAY,
      anchorId: `${rowId}:${go}`,
    };
    const host = document.createElement("div");
    document.body.replaceChildren(host);
    render(
      renderDatabase({ ...state, ui: { ...state.ui, overlay } }, (command) => {
        sent.push(command);
        return { ok: true };
      }),
      host,
    );

    press("Continue");

    expect(document.querySelector(".confirm")?.textContent).toContain("Sure?");
    expect(sent.map((command) => command.type)).toContain("row.pressButton");
  });
});
