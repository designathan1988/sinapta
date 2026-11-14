import { describe, expect, it } from "vitest";
import { createEmptyWorkspace, SCHEMA_VERSION } from "../src/model/index.ts";
import { createTestServer } from "./test-context.ts";

const AT = "2026-11-14T00:00:00.000Z";

function field(body: unknown, key: string): unknown {
  return typeof body === "object" && body !== null && key in body
    ? Object.entries(body).find(([name]) => name === key)?.[1]
    : undefined;
}

function line(text: string) {
  return {
    id: "line",
    type: "paragraph",
    parentId: "plan",
    childIds: [],
    props: { text: [{ text }] },
    createdAt: AT,
    updatedAt: AT,
  };
}

function version(index: number) {
  const takenAt = new Date(Date.parse(AT) + index * 60_000).toISOString();
  return {
    id: `plan@${takenAt}`,
    takenAt,
    blocks: [line(`Draft ${String(index)}`)],
  };
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
  const path = `/api/workspaces/${id}/pages/plan/versions`;
  return { server, path, ada, bia, eve };
}

describe("page versions on the server", () => {
  it("keeps a version one member took, for every other member to read", async () => {
    const { server, path, ada, bia } = await workspaceOfTwo();

    await server.call(`POST ${path}`, version(1), ada);
    const read = await server.call(`GET ${path}`, undefined, bia);

    expect(read.status).toBe(200);
    expect(read.body).toEqual({ versions: [version(1)] });
  });

  it("lists the newest first and keeps the 50 newest of a page", async () => {
    const { server, path, ada } = await workspaceOfTwo();

    for (let index = 0; index < 51; index += 1) {
      await server.call(`POST ${path}`, version(index), ada);
    }
    const read = await server.call(`GET ${path}`, undefined, ada);
    const versions = field(read.body, "versions");

    expect(Array.isArray(versions) && versions.length).toBe(50);
    expect(Array.isArray(versions) && versions[0]).toEqual(version(50));
    expect(Array.isArray(versions) && versions.at(-1)).toEqual(version(1));
  });

  it("shows nothing to someone outside the workspace", async () => {
    const { server, path, ada, eve } = await workspaceOfTwo();
    await server.call(`POST ${path}`, version(1), ada);

    const read = await server.call(`GET ${path}`, undefined, eve);
    const kept = await server.call(`POST ${path}`, version(2), eve);

    expect(read.status).toBe(404);
    expect(kept.status).toBe(404);
  });

  it("refuses a version whose blocks are not blocks", async () => {
    const { server, path, ada } = await workspaceOfTwo();

    const refused = await server.call(
      `POST ${path}`,
      { id: "plan@x", takenAt: AT, blocks: [{ id: 1 }] },
      ada,
    );

    expect(refused.status).toBe(400);
  });
});
