/**
 * Pack the bundle files into a zip that two runs of the same input reproduce.
 *
 * STORE only (no deflate): compression would introduce encoder-version noise.
 * Every local and central header uses DOS time 1980-01-01 00:00:00, and entries
 * are written in sorted path order so the archive bytes do not depend on Map
 * insertion order or locale.
 */

import { BUNDLE_PATHS } from "./version";

const DOS_DATE = 0x0021; // 1980-01-01
const DOS_TIME = 0x0000;

export function zipBundle(files: ReadonlyMap<string, Uint8Array>): Uint8Array {
  const entries = orderedEntries(files);
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;

  for (const [name, data] of entries) {
    const nameBytes = encodeName(name);
    const crc = crc32(data);
    const local = localHeader(nameBytes, data.byteLength, crc);
    const central = centralHeader(nameBytes, data.byteLength, crc, offset);

    locals.push(local, data);
    centrals.push(central);
    offset += local.byteLength + data.byteLength;
  }

  const centralSize = centrals.reduce((sum, part) => sum + part.byteLength, 0);
  const end = endOfCentral(entries.length, centralSize, offset);

  return concat(locals, centrals, [end]);
}

function orderedEntries(files: ReadonlyMap<string, Uint8Array>): [string, Uint8Array][] {
  const preferred = BUNDLE_PATHS.filter((path) => files.has(path));
  const extras = [...files.keys()]
    .filter((path) => !BUNDLE_PATHS.includes(path as (typeof BUNDLE_PATHS)[number]))
    .sort();

  return [...preferred, ...extras].map((path) => [path, files.get(path)!]);
}

function localHeader(name: Uint8Array, size: number, crc: number): Uint8Array {
  const header = new Uint8Array(30 + name.byteLength);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true); // version needed
  view.setUint16(6, 0, true); // flags
  view.setUint16(8, 0, true); // method STORE
  view.setUint16(10, DOS_TIME, true);
  view.setUint16(12, DOS_DATE, true);
  view.setUint32(14, crc, true);
  view.setUint32(18, size, true);
  view.setUint32(22, size, true);
  view.setUint16(26, name.byteLength, true);
  view.setUint16(28, 0, true); // extra length
  header.set(name, 30);
  return header;
}

function centralHeader(name: Uint8Array, size: number, crc: number, offset: number): Uint8Array {
  const header = new Uint8Array(46 + name.byteLength);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x02014b50, true);
  view.setUint16(4, 20, true); // version made by
  view.setUint16(6, 20, true); // version needed
  view.setUint16(8, 0, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, DOS_TIME, true);
  view.setUint16(14, DOS_DATE, true);
  view.setUint32(16, crc, true);
  view.setUint32(20, size, true);
  view.setUint32(24, size, true);
  view.setUint16(28, name.byteLength, true);
  view.setUint16(30, 0, true);
  view.setUint16(32, 0, true);
  view.setUint16(34, 0, true);
  view.setUint16(36, 0, true);
  view.setUint32(38, 0, true);
  view.setUint32(42, offset, true);
  header.set(name, 46);
  return header;
}

function endOfCentral(count: number, centralSize: number, centralOffset: number): Uint8Array {
  const end = new Uint8Array(22);
  const view = new DataView(end.buffer);
  view.setUint32(0, 0x06054b50, true);
  view.setUint16(4, 0, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, count, true);
  view.setUint16(10, count, true);
  view.setUint32(12, centralSize, true);
  view.setUint32(16, centralOffset, true);
  view.setUint16(20, 0, true);
  return end;
}

function encodeName(name: string): Uint8Array {
  return new TextEncoder().encode(name);
}

function concat(...groups: Uint8Array[][]): Uint8Array {
  const parts = groups.flat();
  const total = parts.reduce((sum, part) => sum + part.byteLength, 0);
  const out = new Uint8Array(total);
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.byteLength;
  }
  return out;
}

/** CRC-32 as ZIP expects it (IEEE, reflected). */
export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.byteLength; i += 1) {
    crc ^= data[i]!;
    for (let bit = 0; bit < 8; bit += 1) {
      const take = crc & 1;
      crc >>>= 1;
      if (take) {
        crc ^= 0xedb88320;
      }
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
