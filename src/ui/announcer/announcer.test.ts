// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { announce } from "./announcer.ts";

describe("announce", () => {
  it("changes the region for the same words twice, so both are heard", () => {
    document.body.innerHTML = '<div data-announcer aria-live="polite"></div>';
    const region = document.querySelector("[data-announcer]");
    const heard: string[] = [];

    for (let time = 0; time < 3; time += 1) {
      announce("Block moved.");
      heard.push(region?.textContent ?? "");
    }

    expect(heard[1]).not.toBe(heard[0]);
    expect(heard[2]).not.toBe(heard[1]);
    expect(heard.map((words) => words.trim())).toEqual([
      "Block moved.",
      "Block moved.",
      "Block moved.",
    ]);
  });
});
