import { describe, expect, it } from "vitest";
import { crc32, writeZip } from "./zip.ts";

const encode = (text: string) => new TextEncoder().encode(text);

// Reads back what the archive's central directory lists, as an unzip does.
function listed(
  zip: Uint8Array,
): { name: string; crc: number; size: number }[] {
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  const end = zip.byteLength - 22;
  expect(view.getUint32(end, true)).toBe(0x06054b50);
  const count = view.getUint16(end + 10, true);
  let at = view.getUint32(end + 16, true);
  const entries = [];
  for (let index = 0; index < count; index += 1) {
    expect(view.getUint32(at, true)).toBe(0x02014b50);
    const crc = view.getUint32(at + 16, true);
    const size = view.getUint32(at + 24, true);
    const nameLength = view.getUint16(at + 28, true);
    const extra = view.getUint16(at + 30, true);
    const comment = view.getUint16(at + 32, true);
    const name = new TextDecoder().decode(
      zip.slice(at + 46, at + 46 + nameLength),
    );
    entries.push({ name, crc, size });
    at += 46 + nameLength + extra + comment;
  }
  return entries;
}

describe("ZIP archives", () => {
  it("check each file with its CRC-32", () => {
    expect(crc32(encode("hello"))).toBe(0x3610a686);
  });

  it("list every file, by its path, as stored", () => {
    const zip = writeZip([
      { path: "Plan.md", data: encode("# Plan\n") },
      { path: "Plan/Résumé.md", data: encode("hello") },
    ]);

    expect(Array.from(zip.slice(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);
    expect(listed(zip)).toEqual([
      { name: "Plan.md", crc: crc32(encode("# Plan\n")), size: 7 },
      { name: "Plan/Résumé.md", crc: 0x3610a686, size: 5 },
    ]);
  });
});
