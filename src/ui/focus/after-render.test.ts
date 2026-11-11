import { describe, expect, it } from "vitest";
import { afterRender } from "./index.ts";

describe("afterRender", () => {
  it("runs the action after the current task, not before", async () => {
    const calls: string[] = [];
    afterRender(() => calls.push("after"));
    calls.push("now");
    await Promise.resolve();
    expect(calls).toEqual(["now", "after"]);
  });
});
