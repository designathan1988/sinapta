import { createServer, request, type Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { createApi } from "./api.ts";
import { ROUTES } from "./routes.ts";
import { createTestServer } from "./test-context.ts";

let server: Server | undefined;

afterEach(() => {
  server?.close();
  server = undefined;
});

// The API on a port of its own, as the dev server serves it.
async function listen(): Promise<number> {
  const { context } = createTestServer();
  const api = createApi(ROUTES, context);
  server = createServer((incoming, response) => {
    void api(incoming, response);
  });
  await new Promise<void>((done) => server?.listen(0, "127.0.0.1", done));
  const address = server.address();
  return typeof address === "object" && address !== null ? address.port : 0;
}

function send(
  port: number,
  method: string,
  headers: Record<string, string>,
): Promise<{ status: number; body: string }> {
  return new Promise((done, fail) => {
    const call = request(
      {
        host: "127.0.0.1",
        port,
        path: "/api/account/sign-in",
        method,
        headers,
      },
      (response) => {
        let body = "";
        response.on("data", (chunk: Buffer) => (body += chunk.toString()));
        response.on("end", () => {
          done({ status: response.statusCode ?? 0, body });
        });
      },
    );
    call.on("error", fail);
    call.end(method === "GET" ? undefined : "{}");
  });
}

describe("the server's own routes", () => {
  it("say they are alive and how many accounts there are", async () => {
    const port = await listen();
    const health = await new Promise<string>((done) => {
      request({ host: "127.0.0.1", port, path: "/api/health" }, (response) => {
        let body = "";
        response.on("data", (chunk: Buffer) => (body += chunk.toString()));
        response.on("end", () => {
          done(body);
        });
      }).end();
    });

    expect(JSON.parse(health)).toEqual({ ok: true, users: 0 });
  });

  it("refuse a change sent from another site's page", async () => {
    const port = await listen();
    const json = { "Content-Type": "application/json" };

    const foreign = await send(port, "POST", {
      ...json,
      Origin: "https://evil.example",
    });
    const own = await send(port, "POST", {
      ...json,
      Origin: `http://127.0.0.1:${String(port)}`,
    });

    expect(foreign).toMatchObject({ status: 403 });
    expect(foreign.body).toContain("cross-origin");
    expect(own.status).not.toBe(403);
  });
});
