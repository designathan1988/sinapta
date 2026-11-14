import { describe, expect, it } from "vitest";
import {
  createEmptyWorkspace,
  SCHEMA_VERSION,
  toBlockId,
} from "../src/model/index.ts";
import { createTestServer } from "./test-context.ts";
import { currentWorkspace } from "./workspace-state.ts";

const AT = "2026-11-14T00:00:00.000Z";

function field(body: unknown, key: string): unknown {
  return typeof body === "object" && body !== null && key in body
    ? Object.entries(body).find(([name]) => name === key)?.[1]
    : undefined;
}

describe("a workspace kept by an older version of the app", () => {
  it("is brought up to the current format, as the browser brings its own", async () => {
    const server = createTestServer();
    const reply = await server.call("POST /api/account/sign-up", {
      email: "ada@pagecraft.test",
      password: "long enough",
      name: "Ada",
    });
    const cookie = reply.cookies?.[0] ?? "";
    const page = {
      id: "plan",
      type: "page",
      parentId: null,
      childIds: [],
      props: { title: [{ text: "Plan" }] },
      createdAt: AT,
      updatedAt: AT,
    };
    const snapshot = {
      schemaVersion: SCHEMA_VERSION - 1,
      rootIds: ["plan"],
      blocks: { plan: page },
      views: {},
      settings: createEmptyWorkspace().settings,
    };
    const created = await server.call(
      "POST /api/workspaces",
      { name: "Ada's", snapshot },
      cookie,
    );
    const id = String(field(field(created.body, "workspace"), "id"));

    const workspace = currentWorkspace(server.context, id);

    expect(workspace?.blocks[toBlockId("plan")]?.props).toMatchObject({
      title: [{ text: "Plan" }],
    });
  });
});
