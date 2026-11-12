// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { writeZip } from "../../model/index.ts";
import type { Command } from "../../state/index.ts";
import { importArchiveFile } from "./markdown-file.view.ts";

const encode = (text: string) => new TextEncoder().encode(text);

// A ZIP file as Notion's Markdown export makes it.
function archive(files: readonly { path: string; text: string }[]): File {
  const bytes = writeZip(
    files.map((file) => ({ path: file.path, data: encode(file.text) })),
  );
  return new File([new Uint8Array(bytes)], "Export.zip", {
    type: "application/zip",
  });
}

async function imported(file: File): Promise<Command[]> {
  const sent: Command[] = [];
  await importArchiveFile(file, (command) => {
    sent.push(command);
    return { ok: true };
  });
  return sent;
}

describe("importing a Markdown archive", () => {
  it("makes its pages with their subpages inside them", async () => {
    const sent = await imported(
      archive([
        { path: "Plans.md", text: "# Plans\n\nHello" },
        { path: "Plans/Ideas.md", text: "# Ideas" },
        { path: "Plans/photo.png", text: "not a page" },
      ]),
    );

    expect(sent).toEqual([
      expect.objectContaining({
        type: "page.importMarkdown",
        title: "Plans",
        subpages: [expect.objectContaining({ title: "Ideas" })],
      }),
    ]);
  });

  it("imports nothing from a file that is no archive", async () => {
    const sent = await imported(new File(["plain"], "Broken.zip"));

    expect(sent).toEqual([]);
  });
});
