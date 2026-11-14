import { describe, expect, it } from "vitest";
import type { ApiRequest } from "./http-exchange.ts";
import { SESSION_COOKIE } from "./sessions.ts";
import { createTestServer } from "./test-context.ts";
import { samplesOf, transcriptionRoutes } from "./transcription.ts";

const ROUTE = "POST /api/workspaces/:id/transcribe";

function pcm(values: readonly number[]): string {
  const bytes = Buffer.alloc(values.length * 2);
  values.forEach((value, index) => bytes.writeInt16LE(value, index * 2));
  return bytes.toString("base64");
}

async function signedIn() {
  const server = createTestServer();
  const signUp = await server.call("POST /api/account/sign-up", {
    email: "ada@pagecraft.test",
    password: "long enough",
    name: "Ada",
  });
  const cookie = signUp.cookies?.[0] ?? "";
  const created = await server.call(
    "POST /api/workspaces",
    { name: "Ada's", snapshot: {} },
    cookie,
  );
  const body = JSON.stringify(created.body);
  const id = /"id":"([^"]+)"/.exec(body)?.[1] ?? "";
  const token = cookie.split(";")[0]?.split("=")[1] ?? "";
  return { server, id, token };
}

function request(id: string, token: string, body: unknown): ApiRequest {
  return {
    method: "POST",
    path: `/api/workspaces/${id}/transcribe`,
    query: new URLSearchParams(),
    cookies: new Map(token === "" ? [] : [[SESSION_COOKIE, token]]),
    sameOrigin: true,
    body,
    params: { id },
  };
}

describe("transcription on the server", () => {
  it("reads 16-bit samples as numbers between -1 and 1", () => {
    expect([...samplesOf(pcm([0, 16_384, -32_768]))]).toEqual([0, 0.5, -1]);
  });

  it("gives a member the words the model heard in the samples", async () => {
    const { server, id, token } = await signedIn();
    const heard: number[] = [];
    const route = transcriptionRoutes((samples) => {
      heard.push(samples.length);
      return Promise.resolve("We ship on Friday.");
    })[ROUTE];

    const reply = await route?.(
      request(id, token, { audio: pcm([1, 2, 3]) }),
      server.context,
    );

    expect(reply).toMatchObject({
      status: 200,
      body: { text: "We ship on Friday." },
    });
    expect(heard).toEqual([3]);
  });

  it("refuses someone signed out, and says when no model can be loaded", async () => {
    const { server, id, token } = await signedIn();
    const failing = transcriptionRoutes(() =>
      Promise.reject(new Error("offline")),
    )[ROUTE];

    const out = await failing?.(
      request(id, "", { audio: pcm([1]) }),
      server.context,
    );
    const broken = await failing?.(
      request(id, token, { audio: pcm([1]) }),
      server.context,
    );

    expect(out?.status).toBe(401);
    expect(broken).toMatchObject({ status: 503 });
  });
});
