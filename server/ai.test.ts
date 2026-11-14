import { afterEach, describe, expect, it, vi } from "vitest";
import { askLocally, MODEL, OLLAMA } from "./ai.ts";
import { createTestServer } from "./test-context.ts";

const NOTES =
  "The launch moved to Friday. We need to update the press kit. Grace will call the printer. Everything else is ready.";

describe("the AI without a model", () => {
  it("finds the action items, one per line", () => {
    expect(askLocally("action-items", NOTES)).toBe(
      "- We need to update the press kit.\n- Grace will call the printer.",
    );
  });

  it("summarizes and shortens by the first sentences", () => {
    expect(askLocally("summarize", NOTES)).toBe(
      "The launch moved to Friday. We need to update the press kit.",
    );
    expect(askLocally("shorter", NOTES)).toBe(
      "The launch moved to Friday. We need to update the press kit.",
    );
  });

  it("leaves to a model what needs one", () => {
    expect(askLocally("improve", NOTES)).toBeUndefined();
  });

  it("answers a free question that names a plain-text action", () => {
    expect(askLocally("ask", `Summarize: ${NOTES}`)).toBe(
      "The launch moved to Friday. We need to update the press kit.",
    );
    expect(askLocally("ask", "Write a poem about Friday")).toBeUndefined();
  });

  it("reads the named action after spaces before it", () => {
    expect(askLocally("ask", `  summarize: ${NOTES}`)).toBe(
      "The launch moved to Friday. We need to update the press kit.",
    );
    expect(askLocally("ask", ` list the action items: ${NOTES}`)).toContain(
      "- Grace will call the printer.",
    );
  });
});

async function signedIn() {
  const server = createTestServer();
  const signUp = await server.call("POST /api/account/sign-up", {
    email: "ada@pagecraft.test",
    password: "long enough",
    name: "Ada",
  });
  const ask = (action: string, text: string) =>
    server.call("POST /api/ai", { action, text }, signUp.cookies?.[0]);
  return { ask };
}

describe("POST /api/ai", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("asks the local Ollama model when one answers", async () => {
    const fetched = vi.fn<typeof fetch>(() =>
      Promise.resolve(Response.json({ response: "  Better words. " })),
    );
    vi.stubGlobal("fetch", fetched);
    const { ask } = await signedIn();

    const asked = await ask("improve", "words");

    expect(asked.body).toEqual({ text: "Better words.", provider: "ollama" });
    const [url, init] = fetched.mock.calls[0] ?? [];
    expect(url).toBe(OLLAMA);
    const body = typeof init?.body === "string" ? init.body : "";
    expect(body).toContain(`"model":"${MODEL}"`);
  });

  it("answers without a model when Ollama does not answer", async () => {
    vi.stubGlobal("fetch", () => Promise.reject(new Error("refused")));
    const { ask } = await signedIn();

    const local = await ask("summarize", NOTES);
    const missing = await ask("improve", NOTES);

    expect(local.body).toMatchObject({ provider: "local" });
    expect(missing).toMatchObject({
      status: 503,
      body: { error: "model-missing" },
    });
  });
});
