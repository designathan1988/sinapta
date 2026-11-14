import { describe, expect, it } from "vitest";
import { SHORTCUTS } from "../../ui/shortcuts/index.ts";
import { keyLabel, SHORTCUT_GROUPS } from "./shortcut-help.selectors.ts";

describe("keyLabel", () => {
  it("names the main modifier for the platform", () => {
    expect(keyLabel("Mod", true)).toBe("⌘");
    expect(keyLabel("Mod", false)).toBe("Ctrl");
    expect(keyLabel("Alt", true)).toBe("⌥");
    expect(keyLabel("Alt", false)).toBe("Alt");
  });

  it("leaves other keys as they are", () => {
    expect(keyLabel("K", true)).toBe("K");
  });
});

describe("the shortcut reference", () => {
  it("lists every global shortcut of the registry", () => {
    const listed = SHORTCUT_GROUPS.flatMap((group) => group.entries).map(
      (entry) => entry.keys.join("+"),
    );
    const registered = SHORTCUTS.map((shortcut) =>
      [
        ...(shortcut.withModifier ? ["Mod"] : []),
        ...(shortcut.withAlt === true ? ["Alt"] : []),
        ...(shortcut.withShift ? ["Shift"] : []),
        shortcut.key.toUpperCase(),
      ].join("+"),
    );

    expect(listed).toEqual(expect.arrayContaining(registered));
  });
});
