// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { applyTheme } from "./theme.ts";

function mount(): HTMLMetaElement {
  document.head.innerHTML = '<meta name="color-scheme" content="light dark" />';
  document.documentElement.removeAttribute("data-theme");
  const meta = document.querySelector("meta");
  if (meta === null) throw new Error("setup");
  return meta;
}

describe("applyTheme", () => {
  it("sets a manual theme on the root and the color scheme", () => {
    const meta = mount();

    applyTheme("dark");

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(meta.content).toBe("dark");
  });

  it("follows the system again when set back to system", () => {
    const meta = mount();
    applyTheme("light");

    applyTheme("system");

    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
    expect(meta.content).toBe("light dark");
  });

  it("changes nothing in the document when the theme is the same", async () => {
    mount();
    applyTheme("dark");
    const changes: MutationRecord[] = [];
    const observer = new MutationObserver((records) =>
      changes.push(...records),
    );
    observer.observe(document.documentElement, {
      attributes: true,
      subtree: true,
    });

    applyTheme("dark");
    await Promise.resolve();
    observer.disconnect();

    expect(changes).toEqual([]);
  });
});
