// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { downloadFile, downloadTextFile } from "./download.ts";

afterEach(() => {
  vi.restoreAllMocks();
});

// What the browser was asked to save: the link clicked and its blob.
function watchDownloads() {
  const blobs: Blob[] = [];
  const clicked: { name: string; href: string }[] = [];
  vi.spyOn(URL, "createObjectURL").mockImplementation((blob) => {
    if (blob instanceof Blob) blobs.push(blob);
    return "blob:saved";
  });
  const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {
    /* nothing to free in a test */
  });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    clicked.push({ name: this.download, href: this.href });
  });
  return { blobs, clicked, revoke };
}

describe("downloads", () => {
  it("saves text under its name and type, then frees the address", async () => {
    const { blobs, clicked, revoke } = watchDownloads();

    downloadTextFile({
      name: "Plan.md",
      type: "text/markdown",
      text: "# Plan",
    });

    expect(clicked).toEqual([{ name: "Plan.md", href: "blob:saved" }]);
    expect(blobs[0]?.type).toBe("text/markdown");
    expect(await blobs[0]?.text()).toBe("# Plan");
    expect(revoke).toHaveBeenCalledWith("blob:saved");
  });

  it("saves bytes, such as a ZIP archive", async () => {
    const { blobs, clicked } = watchDownloads();

    downloadFile({
      name: "Export.zip",
      type: "application/zip",
      data: new Uint8Array([80, 75, 3, 4]),
    });

    expect(clicked[0]?.name).toBe("Export.zip");
    expect([
      ...new Uint8Array(await (blobs[0]?.arrayBuffer() ?? new ArrayBuffer(0))),
    ]).toEqual([80, 75, 3, 4]);
  });
});
