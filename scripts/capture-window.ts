// What a photo needs running before it is taken: for Notion, a plain
// Chrome window signed in to the test account, kept open on port 9333;
// for Pagecraft, the review server on port 5190.
import { spawn } from "node:child_process";
import { resolve } from "node:path";

export const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
export const NOTION_PORT = 9333;
export const REVIEW_URL = "http://localhost:5190/";

// The review server's own test account (ADR-0013): photos of Pagecraft are
// taken signed in, except in a plan marked "guest".
export const REVIEW_ACCOUNT = {
  email: "review@pagecraft.test",
  name: "Review",
  password: "review-pagecraft-local",
};

async function answers(url: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}

async function waitFor(url: string, seconds: number): Promise<void> {
  const deadline = Date.now() + seconds * 1000;
  while (Date.now() < deadline) {
    if (await answers(url)) return;
    await new Promise((done) => setTimeout(done, 250));
  }
  throw new Error(`Nothing answered at ${url} within ${String(seconds)} s.`);
}

// Opens the Notion window when it is not open: plain Chrome, not an
// automated one (Google refuses to sign in inside those), on a profile
// kept for photos. It stays open after the photo; it is never closed.
export async function ensureNotionWindow(): Promise<void> {
  const version = `http://127.0.0.1:${String(NOTION_PORT)}/json/version`;
  if (await answers(version)) return;
  const profile = resolve(".captures", "profiles", "notion");
  const chrome = spawn(
    CHROME,
    [
      `--user-data-dir=${profile}`,
      `--remote-debugging-port=${String(NOTION_PORT)}`,
      "--no-first-run",
      "--no-default-browser-check",
      "https://www.notion.so/",
    ],
    { detached: true, stdio: "ignore" },
  );
  chrome.unref();
  await waitFor(version, 20);
}

// Starts the review server when it is not running, and hands back how to
// stop it again: a server this script started does not outlive it.
export async function ensureReviewServer(): Promise<() => void> {
  if (await answers(REVIEW_URL)) return () => undefined;
  const server = spawn("npx", ["vite", "--port", "5190", "--strictPort"], {
    shell: true,
    stdio: "ignore",
  });
  await waitFor(REVIEW_URL, 20);
  return () => {
    if (server.pid === undefined) return;
    spawn("taskkill", ["/PID", String(server.pid), "/T", "/F"]);
  };
}
