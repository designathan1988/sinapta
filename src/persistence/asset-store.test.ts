import { describe, expect, it } from "vitest";
import { fromBase64, saveAsset, toBase64 } from "./asset-store.ts";
import { createMemoryAdapter } from "./storage-adapter.ts";

const file = new Blob(["pixels"], { type: "image/png" });

describe("saveAsset", () => {
  it("keeps the file under a new asset id", async () => {
    const adapter = createMemoryAdapter();

    const result = await saveAsset(adapter, { file, name: "cat.png" });

    if (!result.ok) throw new Error(result.error);
    const stored = adapter.assets.get(result.id);
    expect(stored).toMatchObject({
      type: "image/png",
      name: "cat.png",
      size: 6,
    });
    expect(await stored?.blob.text()).toBe("pixels");
  });

  it("refuses a file over the limit", async () => {
    const adapter = createMemoryAdapter();

    const result = await saveAsset(adapter, {
      file,
      name: "cat.png",
      limit: 5,
    });

    expect(result).toEqual({ ok: false, error: "too-large" });
    expect(adapter.assets.size).toBe(0);
  });

  it("says when storage is full", async () => {
    const adapter = {
      ...createMemoryAdapter(),
      putAssets: () =>
        Promise.reject(new DOMException("full", "QuotaExceededError")),
    };

    const result = await saveAsset(adapter, { file, name: "cat.png" });

    expect(result).toEqual({ ok: false, error: "quota-exceeded" });
  });
});

describe("base64", () => {
  it("round-trips bytes", async () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 255]);

    const data = await toBase64(new Blob([bytes]));
    const back = new Uint8Array(await fromBase64(data, "x/y").arrayBuffer());

    expect([...back]).toEqual([...bytes]);
  });
});
