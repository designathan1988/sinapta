// A ZIP archive of stored, uncompressed files, laid out as the format's
// specification says, each checked by its CRC-32: what a page and its
// subpages export as. The same files always make the same archive.

export interface ZipFile {
  // Its place in the archive, folders joined by "/".
  readonly path: string;
  readonly data: Uint8Array;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) === 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc = (CRC_TABLE[(crc ^ byte) & 0xff] ?? 0) ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const LOCAL_SIGNATURE = 0x04034b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const END_SIGNATURE = 0x06054b50;
const VERSION = 20;
// Names are UTF-8.
const UTF8_NAMES = 0x0800;
// 1 January 1980, the earliest date the format holds.
const DOS_DATE = (1 << 5) | 1;

interface Entry {
  readonly name: Uint8Array;
  readonly data: Uint8Array;
  readonly crc: number;
  readonly offset: number;
}

// The fields a local header and a central record share, from "version
// needed" to the name's length.
function writeShared(view: DataView, at: number, entry: Entry): void {
  view.setUint16(at, VERSION, true);
  view.setUint16(at + 2, UTF8_NAMES, true);
  view.setUint16(at + 4, 0, true);
  view.setUint16(at + 6, 0, true);
  view.setUint16(at + 8, DOS_DATE, true);
  view.setUint32(at + 10, entry.crc, true);
  view.setUint32(at + 14, entry.data.length, true);
  view.setUint32(at + 18, entry.data.length, true);
  view.setUint16(at + 22, entry.name.length, true);
  view.setUint16(at + 24, 0, true);
}

function localHeader(entry: Entry): Uint8Array {
  const bytes = new Uint8Array(30 + entry.name.length);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, LOCAL_SIGNATURE, true);
  writeShared(view, 4, entry);
  bytes.set(entry.name, 30);
  return bytes;
}

function centralRecord(entry: Entry): Uint8Array {
  const bytes = new Uint8Array(46 + entry.name.length);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, CENTRAL_SIGNATURE, true);
  view.setUint16(4, VERSION, true);
  writeShared(view, 6, entry);
  view.setUint32(42, entry.offset, true);
  bytes.set(entry.name, 46);
  return bytes;
}

function endRecord(count: number, size: number, offset: number): Uint8Array {
  const bytes = new Uint8Array(22);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, END_SIGNATURE, true);
  view.setUint16(8, count, true);
  view.setUint16(10, count, true);
  view.setUint32(12, size, true);
  view.setUint32(16, offset, true);
  return bytes;
}

function joined(parts: readonly Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(total);
  let at = 0;
  for (const part of parts) {
    result.set(part, at);
    at += part.length;
  }
  return result;
}

export function writeZip(files: readonly ZipFile[]): Uint8Array {
  const encoder = new TextEncoder();
  const entries: Entry[] = [];
  const local: Uint8Array[] = [];
  let offset = 0;
  for (const file of files) {
    const name = encoder.encode(file.path);
    const entry = { name, data: file.data, crc: crc32(file.data), offset };
    const header = localHeader(entry);
    entries.push(entry);
    local.push(header, file.data);
    offset += header.length + file.data.length;
  }
  const central = entries.map(centralRecord);
  const size = central.reduce((sum, part) => sum + part.length, 0);
  return joined([
    ...local,
    ...central,
    endRecord(entries.length, size, offset),
  ]);
}
