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

function snapshotIn(body: unknown): unknown {
  return typeof body === "object" && body !== null && "snapshot" in body
    ? body.snapshot
    : undefined;
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

  it("gives a guest the pages shared with them alone, at their access", async () => {
    const { server, ada, id } = await published();
    const signUp = await server.call("POST /api/account/sign-up", {
      email: "bia@pagecraft.test",
      password: "long enough",
      name: "Bia",
    });
    const bia = signUp.cookies?.[0] ?? "";
    const share = (access: string) =>
      server.call(
        `POST /api/workspaces/${id}/pages/shown/sharing`,
        { email: "bia@pagecraft.test", access },
        ada,
      );
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
              patch: page(blockId, null),
            },
          ],
        },
        bia,
      );
    await share("view");

    const seen = await server.call(`GET /api/workspaces/${id}`, undefined, bia);
    const whileViewing = await retitle("shown");
    const secret = await retitle("secret");
    await share("edit");
    const whileEditing = await retitle("inner");

    expect(seen.body).toMatchObject({
      snapshot: { rootIds: ["shown"] },
      access: { shown: "view" },
    });
    expect(blockIdsOf(snapshotIn(seen.body))).toEqual(["inner", "shown"]);
    expect(whileViewing.status).toBe(403);
    expect(secret.status).toBe(403);
    expect(whileEditing.status).toBe(200);
  });

  it("sets the page's general access, Only people invited by default", async () => {
    const { server, ada, id } = await published();
    const base = `/api/workspaces/${id}/pages/shown/sharing`;

    const before = await server.call(`GET ${base}`, undefined, ada);
    const changed = await server.call(
      `POST ${base}/general`,
      { general: "workspace" },
      ada,
    );
    const after = await server.call(`GET ${base}`, undefined, ada);

    expect(before.body).toMatchObject({ general: "invited" });
    expect(changed.status).toBe(200);
    expect(after.body).toMatchObject({ general: "workspace" });
  });

  it("lets no one outside the workspace change the general access", async () => {
    const { server, id } = await published();
    const signUp = await server.call("POST /api/account/sign-up", {
      email: "zed@pagecraft.test",
      password: "long enough",
      name: "Zed",
    });

    const refused = await server.call(
      `POST /api/workspaces/${id}/pages/shown/sharing/general`,
      { general: "web" },
      signUp.cookies?.[0],
    );

    expect(refused.status).toBeGreaterThanOrEqual(403);
  });
});
