// The server's reading of a web page, parsed at the boundary.
import * as v from "valibot";

const previewSchema = v.object({
  title: v.string(),
  description: v.string(),
  image: v.nullable(v.string()),
  icon: v.nullable(v.string()),
});

export function readLinkPreview(value: unknown) {
  const result = v.safeParse(previewSchema, value);
  return result.success ? result.output : undefined;
}
