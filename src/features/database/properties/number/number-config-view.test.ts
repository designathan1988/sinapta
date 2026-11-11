// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { toPropertyId } from "../../database-builder.ts";
import { renderNumberConfig } from "./number-config.view.ts";

function rendered(config?: unknown) {
  const property = {
    id: toPropertyId("p"),
    name: "Price",
    type: "number",
    config,
  };
  const changes: unknown[] = [];
  const host = document.createElement("div");
  render(
    renderNumberConfig(property, (next) => changes.push(next)),
    host,
  );
  const field = (name: string) => {
    const found = host.querySelector(`[data-field="${name}"]`);
    if (!(
      found instanceof HTMLSelectElement || found instanceof HTMLInputElement
    )) {
      throw new Error(`no ${name} field`);
    }
    return found;
  };
  return { host, changes, field };
}

function change(field: HTMLSelectElement | HTMLInputElement, value: string) {
  field.value = value;
  field.dispatchEvent(new Event("change", { bubbles: true }));
}

describe("renderNumberConfig", () => {
  it("sets the format", () => {
    const { changes, field } = rendered();

    change(field("format"), "percent");

    expect(changes).toEqual([{ format: "percent", display: "number" }]);
  });

  it("offers currencies only for the currency format", () => {
    expect(rendered().host.querySelector('[data-field="currency"]')).toBeNull();
    const { changes, field } = rendered({
      format: "currency",
      display: "number",
    });

    change(field("currency"), "BRL");

    expect(changes).toEqual([
      { format: "currency", display: "number", currency: "BRL" },
    ]);
  });

  it("sets what a full bar stands for", () => {
    const { changes, field } = rendered({ format: "number", display: "bar" });

    change(field("divideBy"), "250");
    change(field("divideBy"), "-3");

    expect(changes).toEqual([
      { format: "number", display: "bar", divideBy: 250 },
    ]);
  });
});
