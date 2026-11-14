// Takes a step's photo: the window or the region around "clip", and,
// when the plan or the step turns on an overlay, the hand's cursor,
// trail and keys drawn over it (capture-overlay.ts) before it is saved.
import { writeFileSync } from "node:fs";
import type { Page } from "playwright-core";
import type { CapturePlan, CaptureStep } from "./capture.schema.ts";
import type { ShownCursor } from "./capture-cursor-state.ts";
import type { Hand } from "./capture-hand.ts";
import { compose, type Layers } from "./capture-overlay.ts";
import type { Problems } from "./capture-problems.ts";

// The page, the person's hand when the plan asks for one, and the blank
// page the overlays are drawn in, made the first time one is needed.
export interface Stage {
  readonly page: Page;
  readonly hand: Hand | undefined;
  readonly plan: CapturePlan;
  composer: Page | undefined;
  readonly problems: Problems;
}

type Overlay = CaptureStep["overlay"];

function chosen(overlay: Overlay, layer: keyof Layers): boolean | undefined {
  if (typeof overlay === "boolean") return overlay;
  return overlay?.[layer];
}

// Each layer is off unless the step, or else the plan, turns it on.
export function layersFor(plan: CapturePlan, step: CaptureStep): Layers {
  const pick = (layer: keyof Layers): boolean =>
    chosen(step.overlay, layer) ?? chosen(plan.overlay, layer) ?? false;
  return { cursor: pick("cursor"), trail: pick("trail"), keys: pick("keys") };
}

async function region(page: Page, step: CaptureStep) {
  if (step.clip === undefined) return undefined;
  const box = await page.locator(step.clip).first().boundingBox();
  if (box === null) return undefined;
  const pad = step.pad ?? 24;
  return {
    x: Math.max(0, box.x - pad),
    y: Math.max(0, box.y - pad),
    width: box.width + pad * 2,
    height: box.height + pad * 2,
  };
}

export interface Photo {
  readonly step: CaptureStep;
  readonly path: string;
  readonly cursor: ShownCursor | undefined;
}

export async function photograph(stage: Stage, photo: Photo): Promise<void> {
  const { page, hand } = stage;
  const clip = await region(page, photo.step);
  const shot = await page.screenshot(clip === undefined ? {} : { clip });
  const layers = layersFor(stage.plan, photo.step);
  if (!layers.cursor && !layers.trail && !layers.keys) {
    writeFileSync(photo.path, shot);
    return;
  }
  if (hand === undefined) throw new Error('"overlay" needs "human"');
  stage.composer ??= await page.context().newPage();
  const drawn = await compose(stage.composer, shot, {
    layers,
    trace: hand.trace,
    at: hand.at,
    cursor: photo.cursor?.keyword ?? "default",
    pressed: hand.pressed,
    origin: clip ?? { x: 0, y: 0 },
  });
  // The drawing page took the front: a tab left behind is throttled by
  // the browser and would answer the hand late, so the page comes back.
  await page.bringToFront();
  writeFileSync(photo.path, drawn);
}
