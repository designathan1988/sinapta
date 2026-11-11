// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { toPropertyId } from "../../database-builder.ts";
import { propertyType } from "../../property-registry.ts";
import { readFiles } from "./files-value.ts";

const property = { id: toPropertyId("f"), name: "Files", type: "files" };

describe("readFiles", () => {
  it("keeps files that are a safe link or a kept asset", () => {
    expect(
      readFiles([
        { name: "plan.pdf", assetId: "a1" },
        { name: "site", url: "https://example.com/" },
        { name: "both", url: "https://example.com/", assetId: "a2" },
        { name: "unsafe", url: "javascript:alert(1)" },
        { name: "", assetId: "a3" },
        "loose text",
      ]),
    ).toEqual([
      { name: "plan.pdf", assetId: "a1" },
      { name: "site", url: "https://example.com/" },
    ]);
  });

  it("reads no files as an empty cell", () => {
    expect(readFiles([])).toBeUndefined();
    expect(readFiles("plan.pdf")).toBeUndefined();
  });
});

describe("the files cell", () => {
  it("shows images as thumbnails and other files by name", () => {
    const host = document.createElement("div");
    const value = [
      { name: "cat.png", assetId: "a1" },
      { name: "photo", url: "https://example.com/photo.jpg" },
      { name: "plan.pdf", assetId: "a2" },
    ];

    render(
      propertyType("files").renderCell(value, property, {
        assetUrls: { a1: "blob:cat", a2: "blob:plan" },
      }),
      host,
    );

    const images = [...host.querySelectorAll("img")];
    expect(images.map((image) => image.getAttribute("src"))).toEqual([
      "blob:cat",
      "https://example.com/photo.jpg",
    ]);
    expect(images.map((image) => image.alt)).toEqual(["cat.png", "photo"]);
    expect(host.textContent).toContain("plan.pdf");
  });

  it("is written as the names of its files", () => {
    const value = [
      { name: "a.pdf", assetId: "a1" },
      { name: "b.txt", assetId: "a2" },
    ];

    expect(propertyType("files").format(value, property)).toBe("a.pdf, b.txt");
  });
});
