import { describe, expect, it } from "vitest";
import { setTheme, toggleTheme } from "./settings.commands.ts";
import { createTestApp } from "./state-builder.ts";

describe("settings.toggleTheme", () => {
  it("switches dark to light, and anything else to dark", () => {
    const { store, dispatch } = createTestApp({
      commands: [setTheme, toggleTheme],
    });
    const theme = () => store.getState().workspace.settings.theme;

    dispatch(toggleTheme.create({}));
    expect(theme()).toBe("dark");

    dispatch(toggleTheme.create({}));
    expect(theme()).toBe("light");

    dispatch(setTheme.create({ theme: "system" }));
    dispatch(toggleTheme.create({}));
    expect(theme()).toBe("dark");
  });
});
