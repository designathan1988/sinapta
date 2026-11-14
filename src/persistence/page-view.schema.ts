// A page's views as the server answers them, parsed at the boundary.
import * as v from "valibot";

const viewsSchema = v.object({
  views: v.array(
    v.object({ viewedAt: v.string(), viewer: v.nullable(v.string()) }),
  ),
});

export function readPageViews(value: unknown) {
  const parsed = v.safeParse(viewsSchema, value);
  return parsed.success ? parsed.output.views : undefined;
}
