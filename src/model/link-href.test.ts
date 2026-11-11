import { describe, expect, it } from "vitest";
import { safeHref, safeImageSource } from "./link-href.ts";

describe("safeHref", () => {
  it.each([
    ["https://example.com/a?b=1", "https://example.com/a?b=1"],
    ["http://example.com", "http://example.com/"],
    ["mailto:someone@example.com", "mailto:someone@example.com"],
    ["  https://example.com  ", "https://example.com/"],
  ])("allows %j", (href, expected) => {
    expect(safeHref(href)).toBe(expected);
  });

  it.each([
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "file:///etc/passwd",
    "vbscript:msgbox(1)",
    "example.com",
    "/relative/path",
    "",
  ])("refuses %j", (href) => {
    expect(safeHref(href)).toBeUndefined();
  });
});

describe("safeImageSource", () => {
  it.each([
    ["https://example.com/a.png", "https://example.com/a.png"],
    [
      "data:image/png;base64,iVBORw0KGgo=",
      "data:image/png;base64,iVBORw0KGgo=",
    ],
    ["data:image/webp;base64,UklGRg==", "data:image/webp;base64,UklGRg=="],
  ])("allows %j", (source, expected) => {
    expect(safeImageSource(source)).toBe(expected);
  });

  it.each([
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "data:image/svg+xml,<svg onload=alert(1)>",
    "mailto:someone@example.com",
    "file:///c/a.png",
    "",
  ])("refuses %j", (source) => {
    expect(safeImageSource(source)).toBeUndefined();
  });
});
