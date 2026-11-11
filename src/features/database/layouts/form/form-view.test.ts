// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { selectPage } from "../../../../blocks/page/index.ts";
import type { Command } from "../../../../state/index.ts";
import { createDatabaseApp } from "../../database-builder.ts";
import { renderDatabase } from "../../database.view.ts";
import { setFormOptions } from "../../form-options.commands.ts";
import { setViewType } from "../../view-layout.commands.ts";

// A form of a database with a number question; the number is required
// when asked.
function rendered(isRequired = false) {
  const app = createDatabaseApp([{ name: "Points", type: "number" }], []);
  const viewId = app.view().id;
  const [points] = app.propertyIds;
  if (points === undefined) throw new Error("setup");
  app.dispatch(setViewType.create({ viewId, viewType: "form" }));
  if (isRequired) {
    app.dispatch(
      setFormOptions.create({
        viewId,
        options: { requiredPropertyIds: [points] },
      }),
    );
  }
  const sent: Command[] = [];
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  const show = () => {
    render(
      renderDatabase(app.store.getState(), (command) => {
        sent.push(command);
        return app.dispatch(command);
      }),
      host,
    );
  };
  show();
  const field = (name: string) => {
    const found = host.querySelector<HTMLInputElement>(
      `.form__question[data-name="${name}"] input`,
    );
    if (found === null) throw new Error(`no ${name}`);
    return found;
  };
  const submit = () => {
    host
      .querySelector("form")
      ?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    show();
  };
  return { app, host, sent, field, submit, points };
}

describe("the form", () => {
  it("asks a question per property, the name first", () => {
    const { host } = rendered();

    const questions = [
      ...host.querySelectorAll<HTMLElement>(".form__question"),
    ];

    expect(questions.map((question) => question.dataset.name)).toEqual([
      "Name",
      "Points",
    ]);
  });

  it("creates a row with the answers when submitted", () => {
    const { app, field, submit, points } = rendered();
    field("Name").value = "Ana";
    field("Points").value = "7";

    submit();

    const database = app.database();
    const row = selectPage(app.store.getState(), database.childIds[0] ?? null);
    expect(database.childIds).toHaveLength(1);
    expect(row?.props.values?.[points]).toBe(7);
    expect(row?.props.title).toEqual([{ text: "Ana" }]);
  });

  it("keeps an empty required answer from being sent, saying why by its field", () => {
    const { app, host, field, submit } = rendered(true);
    field("Name").value = "Ana";

    submit();

    const points = field("Points");
    const error = host.querySelector(
      `#${points.getAttribute("aria-describedby") ?? "none"}`,
    );
    expect(app.database().childIds).toHaveLength(0);
    expect(points.getAttribute("aria-invalid")).toBe("true");
    expect(error?.textContent).toContain("required");
  });
});
