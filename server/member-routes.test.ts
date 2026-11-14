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
  throw new Error("no workspace");
}

async function adasWorkspace(server: Server) {
  const ada = await signUp(server, "ada@pagecraft.test");
  const created = await server.call(
    "POST /api/workspaces",
    { name: "Ada's", snapshot: {} },
    ada,
  );
  return { ada, id: idOf(created.body) };
}

describe("a workspace's people", () => {
  it("adds a person who has an account at once", async () => {
    const server = createTestServer();
    const { ada, id } = await adasWorkspace(server);
    const bia = await signUp(server, "bia@pagecraft.test");

    await server.call(
      `POST /api/workspaces/${id}/members`,
      { email: "bia@pagecraft.test", role: "member" },
      ada,
    );
    const seen = await server.call(`GET /api/workspaces/${id}`, undefined, bia);

    expect(seen.status).toBe(200);
  });

  it("lets an invited address in when it signs up", async () => {
    const server = createTestServer();
    const { ada, id } = await adasWorkspace(server);

    const invited = await server.call(
      `POST /api/workspaces/${id}/members`,
      { email: "cy@pagecraft.test", role: "guest" },
      ada,
    );
    const cy = await signUp(server, "cy@pagecraft.test");
    const people = await server.call(
      `GET /api/workspaces/${id}/members`,
      undefined,
      cy,
    );

    expect(invited.body).toMatchObject({
      result: "invited",
      invites: [{ email: "cy@pagecraft.test", role: "guest" }],
    });
    expect(people.body).toMatchObject({
      members: [{ name: "ada" }, { name: "cy", role: "guest" }],
      invites: [],
    });
  });

  it("lets only the owner rename the workspace or invite", async () => {
    const server = createTestServer();
    const { ada, id } = await adasWorkspace(server);
    const bia = await signUp(server, "bia@pagecraft.test");
    await server.call(
      `POST /api/workspaces/${id}/members`,
      { email: "bia@pagecraft.test", role: "member" },
      ada,
    );

    const byMember = await server.call(
      `POST /api/workspaces/${id}/name`,
      { name: "Bia's now" },
      bia,
    );
    const byOwner = await server.call(
      `POST /api/workspaces/${id}/name`,
      { name: "Analytical" },
      ada,
    );

    expect(byMember.status).toBe(403);
    expect(byOwner.status).toBe(204);
  });
});
