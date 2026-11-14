import { describe, expect, it } from "vitest";
import { createEmptyWorkspace, SCHEMA_VERSION } from "../src/model/index.ts";
import { createTestServer } from "./test-context.ts";

const AT = "2026-11-14T00:00:00.000Z";

function page(id: string, childIds: string[] = []) {
  return {
    id,
    type: "page",
    parentId: null,
    childIds,
    props: {
      title: [{ text: id }],
      icon: null,
      isFavorite: false,
      isTrashed: false,
    },
    createdAt: AT,
    updatedAt: AT,
  };
}

const SNAPSHOT = {
  schemaVersion: SCHEMA_VERSION,
  rootIds: ["spec", "secret"],
  blocks: {
    spec: page("spec", ["intro"]),
    intro: {
      id: "intro",
      type: "paragraph",
      parentId: "spec",
      childIds: [],
      props: { text: [{ text: "Hello", bold: true }] },
      createdAt: AT,
      updatedAt: AT,
    },
    secret: page("secret"),
  },
  views: {},
  settings: createEmptyWorkspace().settings,
};

function field(body: unknown, key: string): unknown {
  return typeof body === "object" && body !== null
    ? Object.entries(body).find(([name]) => name === key)?.[1]
    : undefined;
}

const results = (body: unknown): unknown[] => {
  const found = field(body, "results");
  return Array.isArray(found) ? found : [];
};

async function connected() {
  const server = createTestServer();
  const signUp = await server.call("POST /api/account/sign-up", {
    email: "ada@pagecraft.test",
    password: "long enough",
    name: "Ada",
  });
  const ada = signUp.cookies?.[0] ?? "";
  const made = await server.call(
    "POST /api/workspaces",
    { name: "Ada's", snapshot: SNAPSHOT },
    ada,
  );
  const id = String(field(field(made.body, "workspace"), "id"));
  const integration = await server.call(
    `POST /api/workspaces/${id}/integrations`,
    { name: "Reports" },
    ada,
  );
  const created = field(integration.body, "created");
  const integrationId = String(field(created, "id"));
  await server.call(
    `POST /api/workspaces/${id}/integrations/${integrationId}/pages`,
    { pageId: "spec", connected: true },
    ada,
  );
  return { server, token: `Bearer ${String(field(created, "secret"))}` };
}

describe("the public API", () => {
  it("refuses a call without a valid secret", async () => {
    const { server } = await connected();

    const call = await server.call("GET /v1/users/me", undefined, "Bearer x");

    expect(call.status).toBe(401);
  });

  it("finds and reads only the pages connected to the integration", async () => {
    const { server, token } = await connected();

    const me = await server.call("GET /v1/users/me", undefined, token);
    const found = await server.call("POST /v1/search", {}, token);
    const blocks = await server.call(
      "GET /v1/blocks/spec/children",
      undefined,
      token,
    );
    const secret = await server.call("GET /v1/pages/secret", undefined, token);

    expect(me.body).toMatchObject({ type: "bot", name: "Reports" });
    expect(results(found.body).map((each) => field(each, "id"))).toEqual([
      "spec",
    ]);
    expect(results(blocks.body)[0]).toMatchObject({
      type: "paragraph",
      paragraph: {
        rich_text: [{ plain_text: "Hello", annotations: { bold: true } }],
      },
    });
    expect(secret.status).toBe(404);
  });

  it("appends blocks and makes pages inside the connected page", async () => {
    const { server, token } = await connected();

    await server.call(
      "PATCH /v1/blocks/spec/children",
      {
        children: [
          {
            type: "to_do",
            to_do: { rich_text: [{ text: { content: "Ship" } }] },
          },
        ],
      },
      token,
    );
    const made = await server.call(
      "POST /v1/pages",
      {
        parent: { page_id: "spec" },
        properties: { title: { title: [{ text: { content: "Notes" } }] } },
      },
      token,
    );
    const blocks = await server.call(
      "GET /v1/blocks/spec/children",
      undefined,
      token,
    );

    expect(made.body).toMatchObject({
      object: "page",
      parent: { type: "page_id", page_id: "spec" },
    });
    expect(results(blocks.body).map((each) => field(each, "type"))).toEqual([
      "paragraph",
      "to_do",
      "child_page",
    ]);
  });
});
