import { describe, expect, it } from "vitest";
import { previewOf } from "./link-preview.ts";

const PAGE = `<html><head>
<title>Fallback</title>
<meta property="og:title" content="Launch &amp; ship">
<meta name="description" content="Everything about the launch.">
<meta content="/cover.png" property="og:image">
<link rel="icon" href="/favicon.png">
</head></html>`;

describe("previewOf", () => {
  it("reads a page's title, description, image and icon from its tags", () => {
    expect(previewOf(PAGE, new URL("https://example.com/post"))).toEqual({
      title: "Launch & ship",
      description: "Everything about the launch.",
      image: "https://example.com/cover.png",
      icon: "https://example.com/favicon.png",
    });
  });

  it("falls back on the title tag, then on the host", () => {
    const base = new URL("https://example.com/");
    expect(previewOf("<title>Only a title</title>", base).title).toBe(
      "Only a title",
    );
    expect(previewOf("<p>nothing</p>", base).title).toBe("example.com");
  });
});
