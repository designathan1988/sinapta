// The one way to photograph Pagecraft or Notion for a visual check:
// 1440 x 900 at 2x, each PNG 2880 x 1800. It starts what the photo needs
// (the review server, or the signed-in Notion window) and takes the
// photos; open each printed PNG with Read and look at it.
//
//   npm run capture -- pagecraft [steps.json]
//   npm run capture -- notion <notion url | steps.json>
//
// Without a steps file it photographs the page whole. Photos go to
// .captures/<target>/<plan name>/. The steps format is in
// capture.schema.ts.
import { mkdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { readCapturePlan, type CapturePlan } from "./capture.schema.ts";
import { takePhotos, type Target } from "./capture-steps.ts";
import { ensureNotionWindow, ensureReviewServer } from "./capture-window.ts";

const USAGE = [
  "usage: npm run capture -- pagecraft [steps.json]",
  "       npm run capture -- notion <notion url | steps.json>",
].join("\n");

function readTarget(word: string): Target {
  if (word === "notion" || word === "pagecraft") return word;
  console.error(USAGE);
  process.exit(1);
}

function readPlan(source: string): { plan: CapturePlan; name: string } {
  if (source.endsWith(".json")) {
    const plan = readCapturePlan(readFileSync(source, "utf8"));
    return { plan, name: basename(source, ".json") };
  }
  const steps = [{ name: "page" }];
  const plan: CapturePlan = source === "" ? { steps } : { url: source, steps };
  return { plan, name: "page" };
}

async function photographNotion(plan: CapturePlan, outDir: string) {
  await ensureNotionWindow();
  const address = await takePhotos("notion", plan, outDir);
  if (!/\/login|\/signup/.test(address)) return;
  console.error("Notion asks for a sign-in: ask the owner to sign in in the");
  console.error("Chrome window open on the Notion profile, then run again.");
  process.exit(2);
}

async function photographPagecraft(plan: CapturePlan, outDir: string) {
  const stop = await ensureReviewServer();
  await takePhotos("pagecraft", plan, outDir);
  stop();
}

const [word = "", source = ""] = process.argv.slice(2);
const target = readTarget(word);
const { plan, name } = readPlan(source);
const outDir = join(".captures", target, name);
mkdirSync(outDir, { recursive: true });
if (target === "notion") await photographNotion(plan, outDir);
else await photographPagecraft(plan, outDir);
