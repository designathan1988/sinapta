import { describe, expect, it } from "vitest";
import { toPropertyId } from "../../../../model/index.ts";
import { checkboxProperty } from "./checkbox.definition.ts";

const offered = checkboxProperty.filterOperators.filter(
  (operator) => operator.isRetired !== true,
);
const operator = (id: string) => {
  const found = checkboxProperty.filterOperators.find((item) => item.id === id);
  if (found === undefined) throw new Error(`no ${id}`);
  return found;
};

// Notion filters a checkbox with Is or Is not and a value, Checked or
// Unchecked (collectionFilterMenuHelpers.operator.checkboxIs, .checkbox.
// checked).
describe("the checkbox's filter", () => {
  it("offers Is and Is not, with Checked and Unchecked to choose", () => {
    expect(offered.map((item) => item.label)).toEqual(["Is", "Is not"]);
    // No value until one is chosen, as Notion's "Selecione…" (n56-color-rule).
    expect(offered.map((item) => item.defaultOperand)).toEqual([
      undefined,
      undefined,
    ]);
    const choices = operator("is").choices?.({
      id: toPropertyId("p"),
      name: "Done",
      type: "checkbox",
    });
    // Unchecked first, as Notion's popover lists them (n59-checkbox-filter).
    expect(choices?.map((choice) => choice.label)).toEqual([
      "Unchecked",
      "Checked",
    ]);
  });

  it("keeps the rows its value names", () => {
    expect(operator("is").test(true, "checked")).toBe(true);
    expect(operator("is").test(undefined, "checked")).toBe(false);
    expect(operator("is").test(undefined, "unchecked")).toBe(true);
    expect(operator("is-not").test(true, "checked")).toBe(false);
    expect(operator("is-not").test(undefined, "checked")).toBe(true);
  });

  it("still reads conditions saved as Is checked and Is not checked", () => {
    expect(operator("is-checked").isRetired).toBe(true);
    expect(operator("is-checked").test(true, "")).toBe(true);
    expect(operator("is-not-checked").test(undefined, "")).toBe(true);
  });
});
