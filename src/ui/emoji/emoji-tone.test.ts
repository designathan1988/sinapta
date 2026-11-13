import { describe, expect, it } from "vitest";
import { withSkinTone } from "./emoji-tone.ts";

describe("withSkinTone", () => {
  it("puts the tone after an emoji that takes one", () => {
    expect(withSkinTone("👍", "medium")).toBe("👍🏽");
    expect(withSkinTone("✋", "dark")).toBe("✋🏿");
  });

  it("puts it in place of the style mark, and keeps a joined sequence", () => {
    expect(withSkinTone("🕵️", "light")).toBe("🕵🏻");
    expect(withSkinTone("🧑‍💻", "medium-dark")).toBe("🧑🏾‍💻");
  });

  it("leaves the default tone and an emoji that takes none as they are", () => {
    expect(withSkinTone("👍", "default")).toBe("👍");
    expect(withSkinTone("😀", "dark")).toBe("😀");
  });
});
