// A reader for CBOR (RFC 8949), as far as a passkey's attestation needs:
// unsigned and negative integers, byte and text strings, arrays and maps.
// Anything else is refused; nothing here runs on untrusted sizes without
// a bound check.

export type CborValue =
  | number
  | string
  | Uint8Array
  | readonly CborValue[]
  | ReadonlyMap<CborValue, CborValue>;

interface Cursor {
  readonly bytes: Uint8Array;
  at: number;
}

function take(cursor: Cursor, count: number): Uint8Array {
  if (count < 0 || cursor.at + count > cursor.bytes.length) {
    throw new Error("cbor: past the end");
  }
  const part = cursor.bytes.subarray(cursor.at, cursor.at + count);
  cursor.at += count;
  return part;
}

// The argument after a head byte: the value itself below 24, else the 1,
// 2 or 4 bytes after it.
function argument(cursor: Cursor, info: number): number {
  if (info < 24) return info;
  const sizes: Readonly<Record<number, number>> = { 24: 1, 25: 2, 26: 4 };
  const size = sizes[info];
  if (size === undefined) throw new Error("cbor: unsupported length");
  return take(cursor, size).reduce((total, byte) => total * 256 + byte, 0);
}

function readMap(cursor: Cursor, count: number): Map<CborValue, CborValue> {
  const map = new Map<CborValue, CborValue>();
  for (let index = 0; index < count; index += 1) {
    const key = readValue(cursor);
    map.set(key, readValue(cursor));
  }
  return map;
}

function readValue(cursor: Cursor): CborValue {
  const [head = 0] = take(cursor, 1);
  const major = head >> 5;
  const count = argument(cursor, head & 31);
  switch (major) {
    case 0:
      return count;
    case 1:
      return -1 - count;
    case 2:
      return take(cursor, count).slice();
    case 3:
      return new TextDecoder().decode(take(cursor, count));
    case 4:
      return Array.from({ length: count }, () => readValue(cursor));
    case 5:
      return readMap(cursor, count);
    default:
      throw new Error("cbor: unsupported type");
  }
}

// The first value in the bytes, and where it ended.
export function decodeCbor(bytes: Uint8Array): {
  readonly value: CborValue;
  readonly end: number;
} {
  const cursor = { bytes, at: 0 };
  const value = readValue(cursor);
  return { value, end: cursor.at };
}
