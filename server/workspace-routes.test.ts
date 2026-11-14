import { describe, expect, it } from "vitest";
import { createTestServer } from "./test-context.ts";

async function signedUp(
  server: ReturnType<typeof createTestServer>,
  email: string,
) {
  const reply = await server.call("POST /api/account/sign-up", {
    email,
    password: "long enough",
    name: email,
  });
  return reply.cookies?.[0] ?? "";
}

function workspaceId(body: unknown): string {
  if (typeof body === "object" && body !== null && "workspace" in body) {
    const { workspace } = body;
    if (
      typeof workspace === "object" &&
      workspace !== null &&
      "id" in workspace &&
      typeof workspace.id === "string"
    ) {
      return workspace.id;
    }
  }
  throw new Error("no workspace in the answer");
}

const BLOCK = {
  id: "b1",
  type: "page",
  parentId: null,
  childIds: [],
  props: { title: [] },
  createdAt: "2026-11-14T00:00:00.000Z",
  updatedAt: "2026-11-14T00:00:00.000Z",
};

describe("workspaces on the server", () => {
  it("keeps the uploaded workspace and the operations sent since", async () => {
    const server = createTestServer();
    const ada = await signedUp(server, "ada@pagecraft.test");
    const created = await server.call(
      "POST /api/workspaces",
      { name: "Ada's", snapshot: { rootIds: [] } },
      ada,
    );
    const id = workspaceId(created.body);

    const sent = await server.call(
      `POST /api/workspaces/${id}/operations`,
      {
        clientId: "client-one",
        operations: [{ type: "record.create", kind: "block", record: BLOCK }],
      },
      ada,
    );
    const read = await server.call(`GET /api/workspaces/${id}`, undefined, ada);

    expect(sent.body).toEqual({ seq: 1 });
    expect(read.body).toMatchObject({
      seq: 0,
      snapshot: { rootIds: [] },
      operations: [{ seq: 1, clientId: "client-one" }],
    });
  });

  it("tells the other listeners of a workspace", async () => {
    const server = createTestServer();
    const ada = await signedUp(server, "ada@pagecraft.test");
    const created = await server.call(
      "POST /api/workspaces",
      { name: "Ada's", snapshot: {} },
      ada,
    );
    const id = workspaceId(created.body);
    const heard: unknown[] = [];
    server.context.events.listen(id, (event, data) =>
      heard.push({ event, data }),
    );

    await server.call(
      `POST /api/workspaces/${id}/operations`,
      {
        clientId: "client-one",
        operations: [{ type: "record.delete", kind: "block", id: "b1" }],
      },
      ada,
    );

    expect(heard).toEqual([
      {
        event: "operations",
        data: {
          seq: 1,
          clientId: "client-one",
          operations: [{ type: "record.delete", kind: "block", id: "b1" }],
        },
      },
    ]);
  });

  it("refuses malformed operations and people outside the workspace", async () => {
    const server = createTestServer();
    const ada = await signedUp(server, "ada@pagecraft.test");
    const bia = await signedUp(server, "bia@pagecraft.test");
    const created = await server.call(
      "POST /api/workspaces",
      { name: "Ada's", snapshot: {} },
      ada,
    );
    const id = workspaceId(created.body);

    const bad = await server.call(
      `POST /api/workspaces/${id}/operations`,
      { clientId: "client-one", operations: [{ type: "record.explode" }] },
      ada,
    );
    const outsider = await server.call(
      `GET /api/workspaces/${id}`,
      undefined,
      bia,
    );

    expect(bad.status).toBe(400);
    expect(outsider.status).toBe(404);
  });

  it("lists a person's workspaces and opens the last one they opened", async () => {
    const server = createTestServer();
    const ada = await signedUp(server, "ada@pagecraft.test");
    const make = async (name: string) =>
      workspaceId(
        (
          await server.call(
            "POST /api/workspaces",
            { name, snapshot: { rootIds: [] } },
            ada,
          )
        ).body,
      );
    const first = await make("Home");
    const second = await make("Work");

    const afterMaking = await server.call(
      "GET /api/workspaces",
      undefined,
      ada,
    );
    await server.call(`POST /api/workspaces/${first}/open`, {}, ada);
    const afterSwitch = await server.call(
      "GET /api/workspaces",
      undefined,
      ada,
    );

    expect(afterMaking.body).toMatchObject({
      workspaces: [{ name: "Home" }, { name: "Work" }],
      lastWorkspaceId: second,
    });
    expect(afterSwitch.body).toMatchObject({ lastWorkspaceId: first });
  });
});
