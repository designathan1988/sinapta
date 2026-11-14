import { describe, expect, it } from "vitest";
import { createEmptyWorkspace, SCHEMA_VERSION } from "../src/model/index.ts";
import { createTestServer } from "./test-context.ts";

const AT = "2026-11-14T00:00:00.000Z";

function block(
  id: string,
  type: string,
  extra: { createdBy?: { id: string; name: string }; childIds?: string[] },
) {
  return {
    id,
    type,
    parentId: null,
    childIds: extra.childIds ?? [],
    props:
      type === "teamspace"
        ? { name: id, icon: null, description: "" }
        : { title: [{ text: id }] },
    createdAt: AT,
    updatedAt: AT,
    ...(extra.createdBy === undefined ? {} : { createdBy: extra.createdBy }),
  };
}

function field(body: unknown, key: string): unknown {
  return typeof body === "object" && body !== null && key in body
    ? Object.entries(body).find(([name]) => name === key)?.[1]
    : undefined;
}

async function workspaceOfTwo() {
  const server = createTestServer();
  const signUp = (email: string, name: string) =>
    server.call("POST /api/account/sign-up", {
      email,
      password: "long enough",
      name,
    });
  const ada = (await signUp("ada@pagecraft.test", "Ada")).cookies?.[0] ?? "";
  const me = await server.call("GET /api/account/me", undefined, ada);
  const adaId = String(field(field(me.body, "user"), "id"));
  const bia = (await signUp("bia@pagecraft.test", "Bia")).cookies?.[0] ?? "";
  const author = { id: adaId, name: "Ada" };
  const snapshot = {
    schemaVersion: SCHEMA_VERSION,
    rootIds: ["diary", "old", "team"],
    blocks: {
      diary: block("diary", "page", { createdBy: author }),
      old: block("old", "page", {}),
      team: block("team", "teamspace", {}),
    },
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
  return { server, id, bia };
}

// A whole record, as updates travel.
function patchOf(id: string) {
  const { id: _id, ...rest } = block(id, "page", {});
  return { ...rest, props: { title: [{ text: "Mine" }] } };
}

describe("what a member sees", () => {
  it("keeps another member's private pages from them", async () => {
    const { server, id, bia } = await workspaceOfTwo();

    const seen = await server.call(`GET /api/workspaces/${id}`, undefined, bia);

    expect(field(field(seen.body, "snapshot"), "rootIds")).toEqual([
      "old",
      "team",
    ]);
  });

  it("refuses their changes to it, and takes the others", async () => {
    const { server, id, bia } = await workspaceOfTwo();
    const retitle = (blockId: string) =>
      server.call(
        `POST /api/workspaces/${id}/operations`,
        {
          clientId: "bia-client-1",
          operations: [
            {
              type: "record.update",
              kind: "block",
              id: blockId,
              patch: patchOf(blockId),
            },
          ],
        },
        bia,
      );

    expect((await retitle("diary")).status).toBe(403);
    expect((await retitle("old")).status).toBe(200);
  });
});
