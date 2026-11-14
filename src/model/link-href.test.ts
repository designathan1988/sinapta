import { describe, expect, it } from "vitest";
import { safeHref, safeImageSource, typedHref } from "./link-href.ts";

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

describe("typedHref", () => {
  it.each([
    ["example.com", "https://example.com/"],
    ["www.example.org/a?b=1", "https://www.example.org/a?b=1"],
    ["ann@example.com", "mailto:ann@example.com"],
    ["https://example.com/x", "https://example.com/x"],
    ["localhost.dev:8080/p", "https://localhost.dev:8080/p"],
  ])("takes %s as Notion does", (typed, href) => {
    expect(typedHref(typed)).toBe(href);
  });

  it.each(["not a link", "javascript:alert(1)", "file", ""])(
    "refuses %s",
    (typed) => {
      expect(typedHref(typed)).toBeUndefined();
    },
  );
});
