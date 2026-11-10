import { describe, expect, it } from "vitest";
import { createBlockId } from "./id.ts";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe("createBlockId", () => {
  it("returns a string in UUID form", () => {
    expect(createBlockId()).toMatch(UUID_PATTERN);
  });

  it("returns a different id on each call", () => {
    expect(createBlockId()).not.toBe(createBlockId());
  });
});
