import { describe, expect, it } from "vitest";
import { createEmptyWorkspace, SCHEMA_VERSION } from "../src/model/index.ts";
import { createTestServer } from "./test-context.ts";

const AT = "2026-11-14T00:00:00.000Z";

function page(id: string, parentId: string | null, childIds: string[] = []) {
  return {
    id,
    type: "page",
    parentId,
    childIds,
    props: { title: [{ text: id }] },
    createdAt: AT,
    updatedAt: AT,
  };
}

const SNAPSHOT = {
  schemaVersion: SCHEMA_VERSION,
  rootIds: ["shown", "secret"],
  blocks: {
    shown: page("shown", null, ["inner"]),
    inner: page("inner", "shown"),
    secret: page("secret", null),
  },
  views: {},
  settings: createEmptyWorkspace().settings,
};

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

function blockIdsOf(body: unknown): string[] {
  if (typeof body !== "object" || body === null || !("blocks" in body))
    return [];
  const { blocks } = body;
  return typeof blocks === "object" && blocks !== null
    ? Object.keys(blocks).sort()
    : [];
}

async function published() {
  const server = createTestServer();
  const signUp = await server.call("POST /api/account/sign-up", {
    email: "ada@pagecraft.test",
    password: "long enough",
    name: "Ada",
  });
  const ada = signUp.cookies?.[0] ?? "";
  const created = await server.call(
    "POST /api/workspaces",
    { name: "Ada's", snapshot: SNAPSHOT },
    ada,
  );
  return { server, ada, id: idOf(created.body) };
}

describe("published pages", () => {
  it("shows nothing of a page not published", async () => {
    const { server, id } = await published();

    const read = await server.call(`GET /api/public/${id}/shown`);

    expect(read.status).toBe(404);
  });

  it("shows a published page and the pages inside it, and nothing else", async () => {
    const { server, ada, id } = await published();
    await server.call(
      `POST /api/workspaces/${id}/pages/shown/sharing/publish`,
      { published: true },
      ada,
    );

    const shown = await server.call(`GET /api/public/${id}/shown`);
    const inner = await server.call(`GET /api/public/${id}/inner`);
    const secret = await server.call(`GET /api/public/${id}/secret`);

    expect(shown.body).toMatchObject({ rootIds: ["shown"] });
    expect(blockIdsOf(shown.body)).toEqual(["inner", "shown"]);
    expect(inner.status).toBe(200);
    expect(secret.status).toBe(404);
  });

  it("invites a person to a page as a guest of the workspace", async () => {
    const { server, ada, id } = await published();

    const shared = await server.call(
      `POST /api/workspaces/${id}/pages/shown/sharing`,
      { email: "bia@pagecraft.test", access: "comment" },
      ada,
    );
    const people = await server.call(
      `GET /api/workspaces/${id}/members`,
      undefined,
      ada,
    );

    expect(shared.body).toMatchObject({
      people: [{ email: "bia@pagecraft.test", access: "comment", name: null }],
    });
    expect(people.body).toMatchObject({
      invites: [{ email: "bia@pagecraft.test", role: "guest" }],
    });
  });
});
