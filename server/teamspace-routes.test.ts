import { describe, expect, it } from "vitest";
import { createEmptyWorkspace, SCHEMA_VERSION } from "../src/model/index.ts";
import { createTestServer } from "./test-context.ts";

const AT = "2026-11-14T00:00:00.000Z";

function field(body: unknown, key: string): unknown {
  return typeof body === "object" && body !== null
    ? Object.entries(body).find(([name]) => name === key)?.[1]
    : undefined;
}

function teamspace(
  id: string,
  maker: object,
  extra: { props?: object; childIds?: string[] } = {},
) {
  const { props = {}, childIds = [] } = extra;
  return {
    id,
    type: "teamspace",
    parentId: null,
    childIds,
    props: { name: id, icon: null, description: "", ...props },
    createdAt: AT,
    updatedAt: AT,
    createdBy: maker,
  };
}

async function setUp() {
  const server = createTestServer();
  const signUp = async (email: string, name: string) =>
    (
      await server.call("POST /api/account/sign-up", {
        email,
        password: "long enough",
        name,
      })
    ).cookies?.[0] ?? "";
  const ada = await signUp("ada@pagecraft.test", "Ada");
  const me = await server.call("GET /api/account/me", undefined, ada);
  const maker = {
    id: String(field(field(me.body, "user"), "id")),
    name: "Ada",
  };
  const bia = await signUp("bia@pagecraft.test", "Bia");
  const page = {
    id: "spec",
    type: "page",
    parentId: "locked",
    childIds: [],
    props: { title: [{ text: "Spec" }] },
    createdAt: AT,
    updatedAt: AT,
  };
  const snapshot = {
    schemaVersion: SCHEMA_VERSION,
    rootIds: ["open", "club", "secret", "locked"],
    blocks: {
      open: teamspace("open", maker),
      club: teamspace("club", maker, { props: { access: "closed" } }),
      secret: teamspace("secret", maker, { props: { access: "private" } }),
      locked: teamspace("locked", maker, {
        props: { security: { noPublishing: true, noGuests: true } },
        childIds: ["spec"],
      }),
      spec: page,
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
  return { server, id, ada, bia };
}

const namesOf = (body: unknown): unknown[] => {
  const list = field(body, "teamspaces");
  return Array.isArray(list)
    ? list.map((each: unknown) => field(each, "id"))
    : [];
};

describe("teamspaces on the server", () => {
  it("lists all but the private ones a member is not in", async () => {
    const { server, id, bia } = await setUp();

    const listed = await server.call(
      `GET /api/workspaces/${id}/teamspaces`,
      undefined,
      bia,
    );

    expect(namesOf(listed.body)).toEqual(["open", "club", "locked"]);
  });

  it("lets a closed one's owner approve who asks to join", async () => {
    const { server, id, ada, bia } = await setUp();
    const asked = await server.call(
      `POST /api/workspaces/${id}/teamspaces/club/join`,
      {},
      bia,
    );
    const seenByAda = await server.call(
      `GET /api/workspaces/${id}/teamspaces`,
      undefined,
      ada,
    );
    const me = await server.call("GET /api/account/me", undefined, bia);
    const biaId = String(field(field(me.body, "user"), "id"));

    await server.call(
      `POST /api/workspaces/${id}/teamspaces/club/approve`,
      { userId: biaId },
      ada,
    );
    const seenByBia = await server.call(
      `GET /api/workspaces/${id}`,
      undefined,
      bia,
    );

    expect(asked.body).toEqual({ requested: true });
    expect(JSON.stringify(seenByAda.body)).toContain('"requests":[{"userId"');
    expect(field(field(seenByBia.body, "snapshot"), "rootIds")).toContain(
      "club",
    );
  });

  it("keeps teamspace making to owners once limited", async () => {
    const { server, id, ada, bia } = await setUp();
    await server.call(
      `POST /api/workspaces/${id}/teamspace-limit`,
      { limited: true },
      ada,
    );
    const record = { ...teamspace("new", { id: "x", name: "Bia" }) };

    const made = await server.call(
      `POST /api/workspaces/${id}/operations`,
      {
        clientId: "bia-client-1",
        operations: [
          { type: "record.create", kind: "block", record },
          {
            type: "list.insert",
            list: { kind: "rootIds" },
            id: "new",
            index: 4,
          },
        ],
      },
      bia,
    );

    expect(made.status).toBe(403);
  });

  it("refuses publishing and guests where the teamspace forbids them", async () => {
    const { server, id, ada } = await setUp();
    const base = `/api/workspaces/${id}/pages/spec/sharing`;

    const publish = await server.call(
      `POST ${base}/publish`,
      { published: true },
      ada,
    );
    const guest = await server.call(
      `POST ${base}`,
      { email: "out@pagecraft.test", access: "view" },
      ada,
    );

    expect(publish.body).toEqual({ error: "no-publishing" });
    expect(guest.body).toEqual({ error: "no-guests" });
  });
});
