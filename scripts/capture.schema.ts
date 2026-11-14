// The steps of a capture, read from a JSON file:
// { "url"?, "theme"?: "dark" | "light", "guest"?: true, "steps": [ { "name", "eval"?,
//   "click"?, "clickAt"?: [x, y], "rightClick"?, "doubleClick"?, "drag"?,
//   "by"?: [dx, dy], "hold"?,
//   "type"?, "press"?,
//   "hover"?, "expect"?, "clip"?, "pad"?,
//   "wait"?, "read"? } ] }. Selectors are Playwright's (CSS, or
// text=Label). The url defaults to the review server; click, type and
// press act, hover points with the real mouse, expect names what must
// appear after the action (else it is done once more, then the step
// fails with a photo), clip photographs a region around an element, drag
// presses the real mouse on an element and moves it by "by" before
// letting go, and read prints a value measured in the page. A plan with
// "human" does all of it with a person's hand (capture-gestures.ts) and
// prints, after each photo, what the hand did and felt.
import * as v from "valibot";

// Drawn over the photos of a "human" plan, each off unless asked: the
// cursor in the shape the browser shows (with presses and a halo while
// held), the trail of the step's movement, the keys pressed. true turns
// all three on; a step's own "overlay" overrides the plan's.
const overlaySchema = v.union([
  v.boolean(),
  v.object({
    cursor: v.optional(v.boolean()),
    trail: v.optional(v.boolean()),
    keys: v.optional(v.boolean()),
  }),
]);

const stepSchema = v.object({
  name: v.pipe(v.string(), v.regex(/^[a-z0-9-]+$/)),
  eval: v.optional(v.string()),
  click: v.optional(v.string()),
  clickAt: v.optional(v.tuple([v.number(), v.number()])),
  // A file the click's file chooser is given, as a person picks one.
  upload: v.optional(v.string()),
  // How many clicks clickAt makes: 2 double-clicks a word.
  clicks: v.optional(v.number()),
  drag: v.optional(v.string()),
  rightClick: v.optional(v.string()),
  doubleClick: v.optional(v.string()),
  // A key held down while dragging, as "Alt".
  hold: v.optional(v.string()),
  by: v.optional(v.tuple([v.number(), v.number()])),
  type: v.optional(v.string()),
  press: v.optional(v.string()),
  hover: v.optional(v.string()),
  expect: v.optional(v.string()),
  clip: v.optional(v.string()),
  pad: v.optional(v.number()),
  wait: v.optional(v.number()),
  read: v.optional(v.string()),
  // With "human" only (capture-gestures.ts): move the hand to a point,
  // press and keep holding on an element, move to an element (held or
  // not), let go, drag onto an element instead of by an offset, where in
  // the last element reached to aim (fractions of its box), and turn
  // the wheel by [dx, dy] pixels over where the hand is.
  pointAt: v.optional(v.tuple([v.number(), v.number()])),
  down: v.optional(v.string()),
  moveTo: v.optional(v.string()),
  up: v.optional(v.boolean()),
  to: v.optional(v.string()),
  aim: v.optional(v.tuple([v.number(), v.number()])),
  wheel: v.optional(v.tuple([v.number(), v.number()])),
  // A page expression read after every event the hand sends during the
  // step; each change is printed with its time (capture-watch.ts).
  watch: v.optional(v.string()),
  overlay: v.optional(overlaySchema),
  // A photo at every phase of the step's gesture (arrived, pressed,
  // carried, released, typed…), as <step>.<n>-<phase>.png.
  frames: v.optional(v.boolean()),
  // Before acting: cut or restore the network, or read the page again.
  offline: v.optional(v.boolean()),
  reload: v.optional(v.boolean()),
});

// A person's hand and fingers instead of instant, straight input: curved,
// uneven reaches that overshoot and correct, held clicks, typing with a
// rhythm (and slips if "typos" > 0). The seed replays the same hand.
const humanSchema = v.union([
  v.boolean(),
  v.object({
    seed: v.optional(v.number()),
    wpm: v.optional(v.number()),
    typos: v.optional(v.number()),
  }),
]);

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
  human: v.optional(humanSchema),
  overlay: v.optional(overlaySchema),
  frames: v.optional(v.boolean()),
  steps: v.array(stepSchema),
});

export type CapturePlan = v.InferOutput<typeof capturePlanSchema>;
export type CaptureStep = CapturePlan["steps"][number];

export function readCapturePlan(text: string): CapturePlan {
  return v.parse(capturePlanSchema, JSON.parse(text));
}
