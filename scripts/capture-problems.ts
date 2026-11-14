// What went wrong behind the photo during a step: errors the page wrote
// to its console, errors it threw, requests that failed, and answers of
// 400 and above from the server. Printed after the step's photo; only
// the path of each address is kept, never its query.
import type { Page } from "playwright-core";

export interface Problems {
  readonly lines: string[];
}

const pathOf = (url: string): string => {
  try {
    return new URL(url).pathname;
  } catch {
    return url.slice(0, 80);
  }
};

export function listenForProblems(page: Page): Problems {
  const problems: Problems = { lines: [] };
  const add = (line: string): void => {
    problems.lines.push(line.replace(/\s+/g, " ").slice(0, 200));
  };
  page.on("console", (message) => {
    if (message.type() === "error") add(`console error: ${message.text()}`);
  });
  page.on("pageerror", (error) => {
    add(`page error: ${error.message}`);
  });
  page.on("requestfailed", (request) => {
    const reason = request.failure()?.errorText ?? "failed";
    add(
      `request failed: ${request.method()} ${pathOf(request.url())} (${reason})`,
    );
  });
  page.on("response", (response) => {
    if (response.status() < 400) return;
    const request = response.request();
    add(
      `answer ${String(response.status())}: ${request.method()} ${pathOf(response.url())}`,
    );
  });
  return problems;
}

// The step's problems, at most eight lines, and the list emptied.
export function takeProblems(problems: Problems): string[] {
  const lines = problems.lines.splice(0);
  const shown = lines.slice(0, 8).map((line) => `  problem: ${line}`);
  if (lines.length > 8)
    shown.push(`  problem: … and ${String(lines.length - 8)} more`);
  return shown;
}
