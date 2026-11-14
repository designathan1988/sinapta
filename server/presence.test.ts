import { describe, expect, it } from "vitest";
import { createTestServer } from "./test-context.ts";

type Server = ReturnType<typeof createTestServer>;

async function signUp(server: Server, email: string, name: string) {
  const reply = await server.call("POST /api/account/sign-up", {
    email,
    password: "long enough",
    name,
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

describe("presence", () => {
  it("tells everyone in a workspace who is on which page, for a minute", async () => {
    const clock = { now: Date.UTC(2026, 10, 14) };
    const server = createTestServer(clock);
    const ada = await signUp(server, "ada@pagecraft.test", "Ada");
    const bia = await signUp(server, "bia@pagecraft.test", "Bia");
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
    const heard: unknown[] = [];
    server.context.events.listen(id, (event, data) =>
      heard.push({ event, data }),
    );

    await server.call(
      `POST /api/workspaces/${id}/presence`,
      { pageId: "p1" },
      ada,
    );
    await server.call(
      `POST /api/workspaces/${id}/presence`,
      { pageId: "p1" },
      bia,
    );
    clock.now += 61_000;
    const later = await server.call(
      `POST /api/workspaces/${id}/presence`,
      { pageId: "p2" },
      bia,
    );

    expect(heard.at(1)).toMatchObject({
      event: "presence",
      data: {
        people: [
          { name: "Ada", pageId: "p1" },
          { name: "Bia", pageId: "p1" },
        ],
      },
    });
    expect(later.body).toMatchObject({
      people: [{ name: "Bia", pageId: "p2" }],
    });
  });
});
