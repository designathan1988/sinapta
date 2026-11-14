import { describe, expect, it } from "vitest";
import { createEmptyWorkspace, SCHEMA_VERSION } from "../src/model/index.ts";
import { createTestServer } from "./test-context.ts";

const AT = "2026-11-14T00:00:00.000Z";

function field(body: unknown, key: string): unknown {
  return typeof body === "object" && body !== null && key in body
    ? Object.entries(body).find(([name]) => name === key)?.[1]
    : undefined;
}

// The pushes are sent after the answer; one turn of the loop lets them go.
const settled = () =>
  new Promise<void>((done) => {
    setImmediate(done);
  });

function page(id: string, title: unknown[]) {
  return {
    id,
    type: "page",
    parentId: null,
    childIds: [],
    props: { title },
    createdAt: AT,
    updatedAt: AT,
  };
}

async function workspaceOfTwo() {
  const server = createTestServer();
  const signUp = async (email: string, name: string) => {
    const reply = await server.call("POST /api/account/sign-up", {
      email,
      password: "long enough",
      name,
    });
    const cookie = reply.cookies?.[0] ?? "";
    const me = await server.call("GET /api/account/me", undefined, cookie);
    return { cookie, id: String(field(field(me.body, "user"), "id")) };
  };
  const ada = await signUp("ada@pagecraft.test", "Ada");
  const bia = await signUp("bia@pagecraft.test", "Bia");
  const snapshot = {
    schemaVersion: SCHEMA_VERSION,
    rootIds: ["plan"],
    blocks: { plan: page("plan", [{ text: "Plan" }]) },
    views: {},
    settings: createEmptyWorkspace().settings,
  };
  const created = await server.call(
    "POST /api/workspaces",
    { name: "Ada's", snapshot },
    ada.cookie,
  );
  const id = String(field(field(created.body, "workspace"), "id"));
  await server.call(
    `POST /api/workspaces/${id}/members`,
    { email: "bia@pagecraft.test", role: "member" },
    ada.cookie,
  );
  await server.call(
    "POST /api/push/subscribe",
    {
      endpoint: "https://push.example/bia",
      keys: { p256dh: "key", auth: "secret" },
    },
    bia.cookie,
  );
  return { server, id, ada, bia };
}

describe("Web Push", () => {
  it("gives browsers the server's public key", async () => {
    const server = createTestServer();

    const reply = await server.call("GET /api/push/key");

    expect(String(field(reply.body, "publicKey")).length).toBeGreaterThan(40);
  });

  it("tells a mentioned member on their devices, once", async () => {
    const { server, id, ada, bia } = await workspaceOfTwo();
    const mention = (clientId: string) =>
      server.call(
        `POST /api/workspaces/${id}/operations`,
        {
          clientId,
          operations: [
            {
              type: "record.update",
              kind: "block",
              id: "plan",
              patch: {
                ...page("plan", []),
                props: {
                  title: [
                    { text: "Plan for " },
                    {
                      text: "@Bia",
                      mention: { kind: "person", userId: bia.id, name: "Bia" },
                    },
                  ],
                },
              },
            },
          ],
        },
        ada.cookie,
      );

    await mention("ada-client-1");
    await settled();
    await mention("ada-client-2");
    await settled();

    expect(server.pushed).toHaveLength(1);
    expect(server.pushed[0]?.endpoint).toBe("https://push.example/bia");
    expect(JSON.parse(server.pushed[0]?.payload ?? "{}")).toMatchObject({
      body: "Ada mentioned you",
    });
  });

  it("tells someone a page was shared with them", async () => {
    const { server, id, ada } = await workspaceOfTwo();

    await server.call(
      `POST /api/workspaces/${id}/pages/plan/sharing`,
      { email: "bia@pagecraft.test", access: "full" },
      ada.cookie,
    );
    await settled();

    expect(server.pushed.map((sent) => sent.endpoint)).toEqual([
      "https://push.example/bia",
    ]);
  });

  it("forgets a browser that turns the notices off", async () => {
    const { server, id, ada, bia } = await workspaceOfTwo();

    await server.call(
      "POST /api/push/unsubscribe",
      { endpoint: "https://push.example/bia" },
      bia.cookie,
    );
    await server.call(
      `POST /api/workspaces/${id}/pages/plan/sharing`,
      { email: "bia@pagecraft.test", access: "full" },
      ada.cookie,
    );
    await settled();

    expect(server.pushed).toEqual([]);
  });
});
