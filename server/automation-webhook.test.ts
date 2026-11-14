import { describe, expect, it } from "vitest";
import { createEmptyWorkspace, SCHEMA_VERSION } from "../src/model/index.ts";
import { createTestServer } from "./test-context.ts";

function field(body: unknown, key: string): unknown {
  return typeof body === "object" && body !== null && key in body
    ? Object.entries(body).find(([name]) => name === key)?.[1]
    : undefined;
}

async function workspaceOfTwo() {
  const server = createTestServer();
  const signUp = async (email: string) => {
    const reply = await server.call("POST /api/account/sign-up", {
      email,
      password: "long enough",
      name: email,
    });
    return reply.cookies?.[0] ?? "";
  };
  const ada = await signUp("ada@pagecraft.test");
  const bia = await signUp("bia@pagecraft.test");
  const eve = await signUp("eve@pagecraft.test");
  const snapshot = {
    schemaVersion: SCHEMA_VERSION,
    rootIds: [],
    blocks: {},
    views: {},
    settings: createEmptyWorkspace().settings,
  };
  const created = await server.call(
    "POST /api/workspaces",
    { name: "Ada's", snapshot },
    ada,
  );
  const id = String(field(field(created.body, "workspace"), "id"));
  await server.call(
    `POST /api/workspaces/${id}/members`,
    { email: "bia@pagecraft.test", role: "member" },
    ada,
  );
  const path = `/api/workspaces/${id}/pages/plan/views`;
  return { server, path, ada, bia, eve, id };
}

const PAYLOAD = {
  source: { type: "automation", automation_id: "a1" },
  data: {
    object: "page",
    id: "row",
    title: "Ship it",
    properties: { Stage: "Done" },
  },
};

describe("an automation's webhook, sent by the server", () => {
  it("posts the page to a public address for a member", async () => {
    const { server, ada, id } = await workspaceOfTwo();

    const reply = await server.call(
      `POST /api/workspaces/${id}/automation-webhook`,
      { url: "https://hooks.example.com/in", payload: PAYLOAD },
      ada,
    );

    expect(reply.status).toBe(200);
    expect(server.posted).toEqual([
      { url: "https://hooks.example.com/in", body: PAYLOAD },
    ]);
  });

  it("refuses an address on this machine, and someone outside", async () => {
    const { server, ada, eve, id } = await workspaceOfTwo();
    const path = `POST /api/workspaces/${id}/automation-webhook`;

    const inside = await server.call(
      path,
      { url: "http://127.0.0.1:5190/x", payload: PAYLOAD },
      ada,
    );
    const outsider = await server.call(
      path,
      { url: "https://hooks.example.com/in", payload: PAYLOAD },
      eve,
    );

    expect(inside.status).toBe(400);
    expect(outsider.status).toBe(404);
    expect(server.posted).toEqual([]);
  });
});
