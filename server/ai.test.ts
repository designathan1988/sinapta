import { describe, expect, it } from "vitest";
import { askLocally } from "./ai.ts";

const NOTES =
  "The launch moved to Friday. We need to update the press kit. Grace will call the printer. Everything else is ready.";

describe("the AI without a model", () => {
  it("finds the action items, one per line", () => {
    expect(askLocally("action-items", NOTES)).toBe(
      "- We need to update the press kit.\n- Grace will call the printer.",
    );
  });

  it("summarizes and shortens by the first sentences", () => {
    expect(askLocally("summarize", NOTES)).toBe(
      "The launch moved to Friday. We need to update the press kit.",
    );
    expect(askLocally("shorter", NOTES)).toBe(
      "The launch moved to Friday. We need to update the press kit.",
    );
  });

  it("leaves to a model what needs one", () => {
    expect(askLocally("improve", NOTES)).toBeUndefined();
  });
});
