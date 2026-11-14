import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../model/index.ts";
import { chooseSnapshots } from "./server-snapshots.ts";
import { createMemorySnapshots } from "./snapshot-store.ts";

const PAGE = toBlockId("plan");
const BLOCKS = Object.values(buildWorkspace([{ id: "plan" }]).blocks);
const SNAPSHOT = {
  id: "plan@2026-11-14T09:00:00.000Z",
  pageId: PAGE,
  takenAt: "2026-11-14T09:00:00.000Z",
  blocks: BLOCKS,
};

function server() {
  const asked: { path: string; body: unknown }[] = [];
  const send = (input: RequestInfo | URL, init?: RequestInit) => {
    const path = typeof input === "string" ? input : "";
    const body = typeof init?.body === "string" ? init.body : undefined;
    asked.push({
      path,
      body: body === undefined ? undefined : JSON.parse(body),
    });
    const { pageId: _, ...reply } = SNAPSHOT;
    const answer =
      body === undefined ? { versions: [reply] } : { kept: reply.id };
    return Promise.resolve(new Response(JSON.stringify(answer)));
  };
  return { asked, send };
}

describe("page versions while a server workspace is open", () => {
  it("keeps a version on the server, for every member to read", async () => {
    const { asked, send } = server();
    const storage = chooseSnapshots(createMemorySnapshots(), () => "w1", send);

    await storage.putSnapshot(SNAPSHOT);

    expect(asked).toEqual([
      {
        path: "/api/workspaces/w1/pages/plan/versions",
        body: { id: SNAPSHOT.id, takenAt: SNAPSHOT.takenAt, blocks: BLOCKS },
      },
    ]);
  });

  it("reads a page's versions from the server", async () => {
    const { send } = server();
    const storage = chooseSnapshots(createMemorySnapshots(), () => "w1", send);

    expect(await storage.listSnapshots(PAGE)).toEqual([SNAPSHOT]);
  });

  it("finds no versions when the server cannot be reached", async () => {
    const send = () => Promise.reject(new TypeError("offline"));
    const storage = chooseSnapshots(createMemorySnapshots(), () => "w1", send);

    expect(await storage.listSnapshots(PAGE)).toEqual([]);
  });

  it("keeps versions in this browser while no server workspace is open", async () => {
    const { asked, send } = server();
    const storage = chooseSnapshots(createMemorySnapshots(), () => null, send);

    await storage.putSnapshot(SNAPSHOT);

    expect(asked).toEqual([]);
    expect(await storage.listSnapshots(PAGE)).toEqual([SNAPSHOT]);
  });
});
