// A page's versions as the server answers them, parsed at the boundary.
import * as v from "valibot";
import { blockSchema } from "../model/index.ts";

const versionsSchema = v.object({
  versions: v.array(
    v.object({
      id: v.string(),
      takenAt: v.string(),
      blocks: v.array(blockSchema),
    }),
  ),
});

export function readVersions(value: unknown) {
  const parsed = v.safeParse(versionsSchema, value);
  return parsed.success ? parsed.output.versions : undefined;
}
