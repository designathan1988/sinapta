// The one owner of grapheme cluster segmentation. User text is never
// measured or cut by UTF-16 code unit outside this file.
const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

// The first user-perceived character of a text, or "" for empty text.
export function firstGrapheme(text: string): string {
  for (const { segment } of segmenter.segment(text)) return segment;
  return "";
}
