// The steps of a capture, read from a JSON file.
import * as v from "valibot";

const stepSchema = v.object({
  name: v.pipe(v.string(), v.regex(/^[a-z0-9-]+$/)),
  eval: v.optional(v.string()),
  click: v.optional(v.string()),
  hover: v.optional(v.string()),
  clip: v.optional(v.string()),
  pad: v.optional(v.number()),
  wait: v.optional(v.number()),
  read: v.optional(v.string()),
});

export const capturePlanSchema = v.object({
  url: v.optional(v.string()),
  theme: v.optional(v.picklist(["light", "dark"])),
  steps: v.array(stepSchema),
});

export type CapturePlan = v.InferOutput<typeof capturePlanSchema>;
export type CaptureStep = CapturePlan["steps"][number];

export function readCapturePlan(text: string): CapturePlan {
  return v.parse(capturePlanSchema, JSON.parse(text));
}
