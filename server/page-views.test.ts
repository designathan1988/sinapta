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

describe("page views on the server", () => {
  it("keeps who opened a page, for every member to read", async () => {
    const { server, path, ada, bia } = await workspaceOfTwo();

    await server.call(
      `POST ${path}`,
      { viewedAt: "2026-11-14T09:00:00Z" },
      ada,
    );
    await server.call(
      `POST ${path}`,
      { viewedAt: "2026-11-14T10:00:00Z" },
      bia,
    );
    const read = await server.call(`GET ${path}`, undefined, ada);

    expect(read.body).toEqual({
      views: [
        { viewedAt: "2026-11-14T10:00:00Z", viewer: "bia@pagecraft.test" },
        { viewedAt: "2026-11-14T09:00:00Z", viewer: "ada@pagecraft.test" },
      ],
      showsHistory: true,
    });
  });

  it("counts a member who does not allow their view history, unnamed", async () => {
    const { server, path, ada, bia, id } = await workspaceOfTwo();
    await server.call(
      `POST ${path}`,
      { viewedAt: "2026-11-14T10:00:00Z" },
      bia,
    );

    const set = await server.call(
      `POST /api/workspaces/${id}/view-history`,
      { allowed: false },
      bia,
    );
    const byAda = await server.call(`GET ${path}`, undefined, ada);
    const byBia = await server.call(`GET ${path}`, undefined, bia);

    expect(set.status).toBe(200);
    expect(byAda.body).toEqual({
      views: [
        { viewedAt: "2026-11-14T10:00:00Z", viewer: null, isHidden: true },
      ],
      showsHistory: true,
    });
    expect(field(byBia.body, "showsHistory")).toBe(false);
  });

  it("refuses someone outside the workspace, and a view without a time", async () => {
    const { server, path, ada, eve } = await workspaceOfTwo();

    const outside = await server.call(`GET ${path}`, undefined, eve);
    const timeless = await server.call(
      `POST ${path}`,
      { viewedAt: "soon" },
      ada,
    );

    expect(outside.status).toBe(404);
    expect(timeless.status).toBe(400);
  });
});
