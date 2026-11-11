// @vitest-environment happy-dom
import { render } from "lit-html";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Command, Dispatch } from "../../state/index.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { PROPERTIES_OVERLAY } from "./database-menus.view.ts";
import { renderDatabase } from "./database.view.ts";
import { setViewGroupBy } from "./group.commands.ts";

// happy-dom has no Popover API; the panel only needs to be shown.
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "showPopover", {
    value: () => undefined,
    configurable: true,
  });
});

afterAll(() => {
  Reflect.deleteProperty(HTMLElement.prototype, "showPopover");
});

function rendered(isGrouped: boolean) {
  const app = createDatabaseApp(
    [
      { name: "Due", type: "date" },
      { name: "Files", type: "files" },
    ],
    [],
  );
  const [due] = app.propertyIds;
  if (due === undefined) throw new Error("no property");
  if (isGrouped) {
    app.dispatch(
      setViewGroupBy.create({ viewId: app.view().id, propertyId: due }),
    );
  }
  const built = app.store.getState();
  const overlay = { kind: PROPERTIES_OVERLAY, anchorId: app.databaseId };
  const state = { ...built, ui: { ...built.ui, overlay } };
  const sent: Command[] = [];
  const dispatch: Dispatch = (command) => {
    sent.push(command);
    return { ok: true };
  };
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(renderDatabase(state, dispatch), host);
  const field = (name: string) => {
    const found = host.querySelector(`[data-field="${name}"]`);
    if (
      !(found instanceof HTMLSelectElement) &&
      !(found instanceof HTMLInputElement)
    ) {
      throw new Error(`no ${name} field`);
    }
    return found;
  };
  return { sent, field, due };
}

function change(control: HTMLSelectElement | HTMLInputElement, value: string) {
  if (control instanceof HTMLInputElement && control.type === "checkbox") {
    control.checked = value === "true";
  } else {
    control.value = value;
  }
  control.dispatchEvent(new Event("change", { bubbles: true }));
}

describe("the group settings", () => {
  it("offers no grouping and the properties that can group, not files", () => {
    const { field } = rendered(false);

    const options = [...field("property").querySelectorAll("option")];

    expect(options.map((item) => item.textContent.trim())).toEqual([
      "None",
      "Due",
    ]);
  });

  it("groups by the chosen property", () => {
    const { sent, field, due } = rendered(false);

    change(field("property"), due);

    expect(sent).toEqual([
      expect.objectContaining({ type: "view.setGroupBy", propertyId: due }),
    ]);
  });

  it("sorts groups, steps dates and hides empty groups", () => {
    const { sent, field } = rendered(true);

    change(field("sort"), "descending");
    change(field("dateBy"), "week");
    change(field("hideEmpty"), "true");

    expect(sent.map((command) => command)).toEqual([
      expect.objectContaining({ options: { sort: "descending" } }),
      expect.objectContaining({ options: { dateBy: "week" } }),
      expect.objectContaining({ options: { hideEmpty: true } }),
    ]);
  });

  it("stops grouping with none", () => {
    const { sent, field } = rendered(true);

    change(field("property"), "");

    expect(sent).toEqual([
      expect.objectContaining({ type: "view.setGroupBy", propertyId: null }),
    ]);
  });
});
