// Opens a plain Chrome window, not an automated one (Google refuses to
// sign in inside those), on a profile kept for photos, with debugging
// port 9333. The owner signs in there once; the window stays open on its
// own, and npm run capture photographs signed-in sites through it.
// Usage: npm run capture:login -- <profile> <url>
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

const [profile = "", url = ""] = process.argv.slice(2);
if (!/^[a-z0-9-]+$/.test(profile) || !url.startsWith("https://")) {
  console.error("usage: npm run capture:login -- <profile> <https url>");
  process.exit(1);
}
const dir = resolve(".captures", "profiles", profile);
const chrome = spawn(
  CHROME,
  [
    `--user-data-dir=${dir}`,
    "--remote-debugging-port=9333",
    "--no-first-run",
    "--no-default-browser-check",
    url,
  ],
  { detached: true, stdio: "ignore" },
);
chrome.unref();
console.log("Chrome open on port 9333, profile", dir);
