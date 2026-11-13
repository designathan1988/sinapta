// @vitest-environment happy-dom
import { render } from "lit-html";
import { afterEach, describe, expect, it } from "vitest";
import { parseAssetId } from "../../../../model/index.ts";
import type { Command } from "../../../../state/index.ts";
import { installAssetSaver } from "../../../../ui/asset/index.ts";
import type { FileEntry } from "./files-value.ts";
import { renderFilesEditor } from "./files-editor.view.ts";

function rendered(entries: readonly FileEntry[] = []) {
  const changes: (readonly FileEntry[] | undefined)[] = [];
  const sent: Command[] = [];
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    renderFilesEditor({
      entries,
      assetUrls: {},
      onChange: (next) => changes.push(next),
      dispatch: (command) => {
        sent.push(command);
        return { ok: true };
      },
    }),
    host,
  );
  const field = (part: string) => {
    const input = host.querySelector(`[data-part="${part}"]`);
    if (!(input instanceof HTMLInputElement)) throw new Error(`no ${part}`);
    return input;
  };
  return { host, changes, sent, field };
}

afterEach(() => {
  installAssetSaver(() => Promise.resolve({ ok: false, error: "unreadable" }));
});

describe("renderFilesEditor", () => {
  it("adds a link named after its last part", () => {
    const { changes, field } = rendered();
    const link = field("link");

    link.value = "https://example.com/docs/report%20q3.pdf";
    link.form?.dispatchEvent(
      new SubmitEvent("submit", { bubbles: true, cancelable: true }),
    );

    expect(changes).toEqual([
      [
        {
          name: "report q3.pdf",
          url: "https://example.com/docs/report%20q3.pdf",
        },
      ],
    ]);
  });

  it("refuses an address that is not a safe web link", () => {
    const { changes, field } = rendered();
    const link = field("link");

    link.value = "javascript:alert(1)";
    link.form?.dispatchEvent(
      new SubmitEvent("submit", { bubbles: true, cancelable: true }),
    );

    expect(changes).toEqual([]);
    expect(link.getAttribute("aria-invalid")).toBe("true");
  });

  it("removes a file", () => {
    const { changes, host } = rendered([
      { name: "a.pdf", assetId: "a1" },
      { name: "b.pdf", assetId: "b1" },
    ]);

    host
      .querySelector<HTMLButtonElement>('[data-file-index="0"] button')
      ?.click();

    expect(changes).toEqual([[{ name: "b.pdf", assetId: "b1" }]]);
  });

  it("keeps an uploaded file as an asset and adds it", async () => {
    const id = parseAssetId("kept");
    if (id === undefined) throw new Error("setup");
    let saved: Promise<unknown> = Promise.resolve();
    installAssetSaver(() => {
      const result = Promise.resolve({ ok: true as const, id, url: "blob:k" });
      saved = result;
      return result;
    });
    const { changes, sent, field } = rendered();
    const upload = field("upload");
    const file = new File(["%PDF"], "plan.pdf", { type: "application/pdf" });
    Object.defineProperty(upload, "files", { value: [file] });

    upload.dispatchEvent(new Event("change", { bubbles: true }));
    await saved;
    await Promise.resolve();

    expect(changes).toEqual([[{ name: "plan.pdf", assetId: "kept" }]]);
    expect(sent).toEqual([
      expect.objectContaining({
        type: "asset.addUrls",
        urls: { kept: "blob:k" },
      }),
    ]);
  });
});
