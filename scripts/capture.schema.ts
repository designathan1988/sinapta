// The steps of a capture, read from a JSON file:
// { "url"?, "theme"?: "dark" | "light", "guest"?: true, "steps": [ { "name", "eval"?,
//   "click"?, "clickAt"?: [x, y], "rightClick"?, "drag"?, "by"?: [dx, dy],
//   "type"?, "press"?,
//   "hover"?, "expect"?, "clip"?, "pad"?,
//   "wait"?, "read"? } ] }. Selectors are Playwright's (CSS, or
// text=Label). The url defaults to the review server; click, type and
// press act, hover points with the real mouse, expect names what must
// appear after the action (else it is done once more, then the step
// fails with a photo), clip photographs a region around an element, drag
// presses the real mouse on an element and moves it by "by" before
// letting go, and read prints a value measured in the page.
import * as v from "valibot";

const stepSchema = v.object({
  name: v.pipe(v.string(), v.regex(/^[a-z0-9-]+$/)),
  eval: v.optional(v.string()),
  click: v.optional(v.string()),
  clickAt: v.optional(v.tuple([v.number(), v.number()])),
  drag: v.optional(v.string()),
  rightClick: v.optional(v.string()),
  by: v.optional(v.tuple([v.number(), v.number()])),
  type: v.optional(v.string()),
  press: v.optional(v.string()),
  hover: v.optional(v.string()),
  expect: v.optional(v.string()),
  clip: v.optional(v.string()),
  pad: v.optional(v.number()),
  wait: v.optional(v.number()),
  read: v.optional(v.string()),
});

export const capturePlanSchema = v.object({
  url: v.optional(v.string()),
  theme: v.optional(v.picklist(["light", "dark"])),
  // Notion signed out: a clean context, for its sign-in pages.
  guest: v.optional(v.boolean()),
  // A WAV file the headless browser hears as its microphone, allowed
  // without asking: for AI Meeting Notes.
  microphone: v.optional(v.string()),
  // Browser permissions granted to the page, such as "notifications".
  permissions: v.optional(v.array(v.string())),
  // A passkey authenticator in the browser, as a phone's or a laptop's,
  // that confirms each use: Chrome's virtual authenticator.
  passkey: v.optional(v.boolean()),
  steps: v.array(stepSchema),
});

export type CapturePlan = v.InferOutput<typeof capturePlanSchema>;
export type CaptureStep = CapturePlan["steps"][number];

export function readCapturePlan(text: string): CapturePlan {
  return v.parse(capturePlanSchema, JSON.parse(text));
}
