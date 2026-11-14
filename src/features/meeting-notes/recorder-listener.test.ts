import { describe, expect, it } from "vitest";
import { encodeSamples } from "./recorder-listener.ts";

describe("encodeSamples", () => {
  it("writes each sample as a 16-bit little-endian number, in base64", () => {
    const encoded = encodeSamples(Float32Array.from([0, 0.5, -1, 2]));
    const bytes = Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0));
    const view = new DataView(bytes.buffer);

    expect([0, 2, 4, 6].map((at) => view.getInt16(at, true))).toEqual([
      0, 16_384, -32_767, 32_767,
    ]);
  });
});
