import { afterEach, describe, expect, it, vi } from "vitest";
import { createTestServer } from "./test-context.ts";

const NOTES =
  "The launch moved to Friday. We need to update the press kit. Grace will call the printer.";

afterEach(() => {
  vi.useRealTimers();
});

describe("the AI's answer as it is written", () => {
  it("sends the answer in parts, then done, and ends", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout"] });
    const server = createTestServer();
    const signUp = await server.call("POST /api/account/sign-up", {
      email: "ada@pagecraft.test",
      password: "long enough",
      name: "Ada",
    });
    const response = await server.call(
      "POST /api/ai/stream",
      { action: "summarize", text: NOTES },
      signUp.cookies?.[0],
    );
    const events: [string, unknown][] = [];
    const run = { isEnded: false };

    response.stream?.start(
      (event, data) => events.push([event, data]),
      () => {
        run.isEnded = true;
      },
    );
    while (!run.isEnded) await vi.advanceTimersByTimeAsync(50);

    const parts = events.filter(([event]) => event === "part");
    const text = parts
      .map(([, data]) =>
        typeof data === "object" && data !== null && "text" in data
          ? String(data.text)
          : "",
      )
      .join("");
    expect(parts.length).toBeGreaterThan(1);
    expect(text).toBe(
      "The launch moved to Friday. We need to update the press kit.",
    );
    expect(events.at(-1)?.[0]).toBe("done");
  });

  it("refuses someone signed out", async () => {
    const server = createTestServer();

    const response = await server.call("POST /api/ai/stream", {
      action: "summarize",
      text: NOTES,
    });

    expect(response.status).toBe(401);
  });
});
