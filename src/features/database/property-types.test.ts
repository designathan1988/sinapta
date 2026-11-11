import { describe, expect, it } from "vitest";
import { createDatabaseApp, toPropertyId } from "./database-builder.ts";
import { propertyType } from "./property-registry.ts";
import { selectTableModel } from "./table-model.selectors.ts";

const property = { id: toPropertyId("p"), name: "P", type: "email" };

describe("email", () => {
  const email = propertyType("email");

  it("keeps an address and refuses text that is not one", () => {
    expect(email.parse(" ada@example.com ")).toBe("ada@example.com");
    expect(email.parse("not an address")).toBeUndefined();
  });

  it("is edited in an email field", () => {
    expect(email.input).toEqual({ type: "email", mode: "email" });
    expect(email.format("ada@example.com", property)).toBe("ada@example.com");
  });
});

describe("phone", () => {
  const phone = propertyType("phone");

  it("keeps a number with its spacing and refuses letters", () => {
    expect(phone.parse("+1 (555) 010-9999")).toBe("+1 (555) 010-9999");
    expect(phone.parse("call me")).toBeUndefined();
  });
});

describe("created time and last edited time", () => {
  it("are read from the row and cannot be edited", () => {
    const app = createDatabaseApp(
      [
        { name: "Created", type: "created-time" },
        { name: "Edited", type: "edited-time" },
      ],
      [["A"]],
    );
    const model = selectTableModel(app.store.getState(), app.databaseId);
    const [created, edited] = app.propertyIds;
    const row = model?.rows[0];
    if (created === undefined || edited === undefined || row === undefined)
      throw new Error("missing row");

    expect(row.values[created]).toBe("2026-11-10T12:00:00.000Z");
    expect(row.values[edited]).toBe("2026-11-10T12:00:00.000Z");
    expect(propertyType("created-time").editor).toBe("none");
  });

  it("sort and filter by the day", () => {
    const created = propertyType("created-time");
    const after = created.filterOperators.find((item) => item.id === "after");

    expect(after?.test("2026-11-10T12:00:00.000Z", "2026-11-09")).toBe(true);
    expect(
      created.compare("2026-11-10T12:00:00.000Z", "2026-11-11T08:00:00.000Z"),
    ).toBeLessThan(0);
  });
});
