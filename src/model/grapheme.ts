// The one owner of grapheme cluster segmentation. User text is never
// measured or cut by UTF-16 code unit outside this file.
//
// Offsets everywhere in the app are UTF-16 code unit indices, because that
// is what the DOM uses, but they always sit on a cluster boundary. The
// functions here are how an offset gets onto a boundary and moves between
// boundaries.
const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

// The first user-perceived character of a text, or "" for empty text.
export function firstGrapheme(text: string): string {
  for (const { segment } of segmenter.segment(text)) return segment;
  return "";
}

function clamp(text: string, offset: number): number {
  return Math.max(0, Math.min(offset, text.length));
}

interface Cluster {
  readonly index: number;
  readonly length: number;
}

function clusterAt(text: string, offset: number): Cluster | undefined {
  const cluster = segmenter.segment(text).containing(offset);
  // `containing` has no cluster for an offset outside the text.
  return cluster === undefined
    ? undefined
    : { index: cluster.index, length: cluster.segment.length };
}

// The start of the cluster that contains the offset; an offset that is
// already on a boundary is returned unchanged.
export function snapToBoundary(text: string, offset: number): number {
  const clamped = clamp(text, offset);
  return clusterAt(text, clamped)?.index ?? clamped;
}

// The boundary one whole character before the offset.
export function previousBoundary(text: string, offset: number): number {
  const start = snapToBoundary(text, offset);
  if (start < clamp(text, offset)) return start;
  return clusterAt(text, start - 1)?.index ?? 0;
}

// The boundary one whole character after the offset.
export function nextBoundary(text: string, offset: number): number {
  const cluster = clusterAt(text, snapToBoundary(text, offset));
  return cluster === undefined ? text.length : cluster.index + cluster.length;
}
