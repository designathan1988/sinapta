// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { renderMenuName } from "./index.ts";

function rendered() {
  const renamed: string[] = [];
  const host = document.createElement("div");
  render(
    renderMenuName({
      icon: "number",
      label: "Property name",
      value: "Price",
      onRename: (name) => renamed.push(name),
    }),
    host,
  );
  const field = host.querySelector("input");
  if (field === null) throw new Error("no field");
  const type = (text: string) => {
    field.value = text;
    field.dispatchEvent(new Event("change", { bubbles: true }));
  };
  return { host, field, renamed, type };
}

describe("renderMenuName", () => {
  it("shows the icon in its box beside a field ready to type in", () => {
    const { host, field } = rendered();

    expect(host.querySelector(".menu__name-icon .icon")).not.toBeNull();
    expect(field.value).toBe("Price");
    expect(field.hasAttribute("data-autofocus")).toBe(true);
  });

  it("renames with the trimmed name, and puts an empty name back", () => {
    const { field, renamed, type } = rendered();

    type("  Cost ");
    type("   ");

    expect(renamed).toEqual(["Cost"]);
    expect(field.value).toBe("Price");
  });
});
