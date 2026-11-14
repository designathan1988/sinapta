import { describe, expect, it } from "vitest";
import { toPropertyId } from "../../database-builder.ts";
import { verificationProperty } from "./verification.definition.ts";

const PROPERTY = {
  id: toPropertyId("p"),
  name: "Verification",
  type: "verification",
};

function passes(operator: string) {
  const found = verificationProperty.filterOperators.find(
    (item) => item.id === operator,
  );
  return (value: unknown): boolean => found?.test(value, "") ?? false;
}

describe("the verification property", () => {
  it("says whether the row's page is verified, and until when", () => {
    expect(
      verificationProperty.format({ by: "u1", until: null }, PROPERTY),
    ).toBe("Verified");
    expect(
      verificationProperty.format(
        { by: "u1", until: "2026-12-01T12:00:00Z" },
        PROPERTY,
      ),
    ).toBe("Verified until December 1, 2026");
    expect(verificationProperty.format(undefined, PROPERTY)).toBe("");
  });

  it("filters verified rows and the others", () => {
    const verified = { by: "u1", until: null };

    expect(passes("is-verified")(verified)).toBe(true);
    expect(passes("is-verified")(undefined)).toBe(false);
    expect(passes("is-not-verified")(undefined)).toBe(true);
    expect(passes("is-not-verified")(verified)).toBe(false);
  });
});
