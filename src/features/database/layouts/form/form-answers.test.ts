// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { parsePropertyId } from "../../../../model/index.ts";
import { answerOf } from "./form-answers.ts";

const DUE = parsePropertyId("due");

describe("a form's date answer", () => {
  it("reads a day typed as the date picker does, and leaves nonsense out", () => {
    if (DUE === undefined) throw new Error("setup");
    const property = { id: DUE, name: "Due", type: "date" };
    const typed = (text: string) => {
      const data = new FormData();
      data.set(DUE, text);
      return answerOf(data, property, "2026-11-13");
    };

    expect(typed("Nov 20")).toEqual({ start: "2026-11-20" });
    expect(typed("11/20/2026")).toEqual({ start: "2026-11-20" });
    expect(typed("soon-ish")).toBeUndefined();
  });
});
