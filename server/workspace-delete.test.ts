import { describe, expect, it } from "vitest";
import { createTestServer } from "./test-context.ts";

type Server = ReturnType<typeof createTestServer>;

async function signUp(server: Server, email: string): Promise<string> {
  const reply = await server.call("POST /api/account/sign-up", {
    email,
    password: "long enough",
    name: email.split("@")[0],
  });
  return reply.cookies?.[0] ?? "";
}

function idOf(body: unknown): string {
  if (typeof body !== "object" || body === null || !("workspace" in body)) {
    throw new Error("no workspace");
  }
  const { workspace } = body;
  if (
    typeof workspace === "object" &&
    workspace !== null &&
    "id" in workspace
  ) {
    return String(workspace.id);
  }
  throw new Error("no workspace");
}

async function shared(server: Server) {
  const ada = await signUp(server, "ada@pagecraft.test");
  const bia = await signUp(server, "bia@pagecraft.test");
  const created = await server.call(
    "POST /api/workspaces",
    { name: "Ada's", snapshot: {} },
    ada,
  );
  const id = idOf(created.body);
  await server.call(
    `POST /api/workspaces/${id}/members`,
    { email: "bia@pagecraft.test", role: "member" },
    ada,
  );
  return { ada, bia, id };
}

describe("a workspace's settings", () => {
  it("lets its owner set its icon", async () => {
    const server = createTestServer();
    const { ada, id } = await shared(server);

    const set = await server.call(
      `POST /api/workspaces/${id}/icon`,
      { icon: "🚀" },
      ada,
    );
    const list = await server.call("GET /api/workspaces", undefined, ada);

    expect(set.status).toBe(204);
    expect(JSON.stringify(list.body)).toContain("🚀");
  });

  it("deletes it only when its name is typed again", async () => {
    const server = createTestServer();
    const { ada, bia, id } = await shared(server);

    const wrong = await server.call(
      `POST /api/workspaces/${id}/delete`,
      { name: "Ada" },
      ada,
    );
    const byMember = await server.call(
      `POST /api/workspaces/${id}/delete`,
      { name: "Ada's" },
      bia,
    );
    const done = await server.call(
      `POST /api/workspaces/${id}/delete`,
      { name: "Ada's" },
      ada,
    );
    const after = await server.call(
      `GET /api/workspaces/${id}`,
      undefined,
      ada,
    );

    expect([wrong.status, byMember.status, done.status]).toEqual([
      400, 403, 204,
    ]);
    expect(after.status).toBe(404);
  });

  it("lets a member leave, but not its last owner", async () => {
    const server = createTestServer();
    const { ada, bia, id } = await shared(server);

    const left = await server.call(`POST /api/workspaces/${id}/leave`, {}, bia);
    const seen = await server.call(`GET /api/workspaces/${id}`, undefined, bia);
    const owner = await server.call(
      `POST /api/workspaces/${id}/leave`,
      {},
      ada,
    );

    expect(left.status).toBe(204);
    expect(seen.status).toBe(404);
    expect(owner.status).toBe(409);
  });
});
