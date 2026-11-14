import { describe, expect, it } from "vitest";
import { createEmptyWorkspace, SCHEMA_VERSION } from "../src/model/index.ts";
import { createTestServer } from "./test-context.ts";

const AT = "2026-11-14T00:00:00.000Z";
const HOOK = "https://hooks.slack.com/services/T0/B0/secret";
const ICS = "https://calendar.google.com/calendar/ical/ada/private-x/basic.ics";

function field(body: unknown, key: string): unknown {
  return typeof body === "object" && body !== null && key in body
    ? Object.entries(body).find(([name]) => name === key)?.[1]
    : undefined;
}

// Notices go out after the answer; one turn of the loop lets them go.
const settled = () =>
  new Promise<void>((done) => {
    setImmediate(done);
  });

function page(title: unknown[]) {
  return {
    id: "plan",
    type: "page",
    parentId: null,
    childIds: [],
    props: { title },
    createdAt: AT,
    updatedAt: AT,
  };
}

async function workspaceOfTwo() {
  const server = createTestServer();
  const signUp = async (email: string, name: string) => {
    const reply = await server.call("POST /api/account/sign-up", {
      email,
      password: "long enough",
      name,
    });
    const cookie = reply.cookies?.[0] ?? "";
    const me = await server.call("GET /api/account/me", undefined, cookie);
    return { cookie, id: String(field(field(me.body, "user"), "id")) };
  };
  const ada = await signUp("ada@pagecraft.test", "Ada");
  const bia = await signUp("bia@pagecraft.test", "Bia");
  const snapshot = {
    schemaVersion: SCHEMA_VERSION,
    rootIds: ["plan"],
    blocks: { plan: page([{ text: "Plan" }]) },
    views: {},
    settings: createEmptyWorkspace().settings,
  };
  const created = await server.call(
    "POST /api/workspaces",
    { name: "Ada's", snapshot },
    ada.cookie,
  );
  const id = String(field(field(created.body, "workspace"), "id"));
  await server.call(
    `POST /api/workspaces/${id}/members`,
    { email: "bia@pagecraft.test", role: "member" },
    ada.cookie,
  );
  const connect = (app: string, address?: string) =>
    server.call(
      `POST /api/workspaces/${id}/apps`,
      { app, ...(address === undefined ? {} : { address }) },
      ada.cookie,
    );
  return { server, id, ada, bia, connect };
}

describe("connected apps", () => {
  it("connects a links app at once, and lists each app with its address's host only", async () => {
    const { connect } = await workspaceOfTwo();

    await connect("github");
    const listed = await connect("slack", HOOK);

    expect(listed.body).toEqual({
      apps: [
        { app: "github", host: null },
        { app: "slack", host: "hooks.slack.com" },
      ],
    });
  });

  it.each([
    ["no address", undefined],
    ["a plain http address", "http://hooks.slack.com/x"],
    ["this machine", "https://localhost/hook"],
    ["the local network", "https://192.168.1.4/hook"],
  ])("refuses a webhook with %s", async (_, address) => {
    const { connect } = await workspaceOfTwo();

    const refused = await connect("slack", address);

    expect(refused).toMatchObject({
      status: 400,
      body: { error: "bad-address" },
    });
  });

  it("posts a mention to the connected Slack channel", async () => {
    const { server, id, ada, bia, connect } = await workspaceOfTwo();
    await connect("slack", HOOK);

    await server.call(
      `POST /api/workspaces/${id}/operations`,
      {
        clientId: "ada-client",
        operations: [
          {
            type: "record.update",
            kind: "block",
            id: "plan",
            patch: {
              ...page([]),
              props: {
                title: [
                  {
                    text: "@Bia",
                    mention: { kind: "person", userId: bia.id, name: "Bia" },
                  },
                ],
              },
            },
          },
        ],
      },
      ada.cookie,
    );
    await settled();

    expect(server.posted).toEqual([
      { url: HOOK, body: { text: "Ada mentioned Bia in Pagecraft" } },
    ]);
  });

  it("shows the connected calendars' coming events, soonest first", async () => {
    const { server, id, ada, connect } = await workspaceOfTwo();
    server.pages.set(
      ICS,
      [
        "BEGIN:VCALENDAR",
        "BEGIN:VEVENT",
        "SUMMARY:Launch review",
        "DTSTART;TZID=Europe/Lisbon:20261120T093000",
        "END:VEVENT",
        "BEGIN:VEVENT",
        "SUMMARY:Past offsite",
        "DTSTART;VALUE=DATE:20261101",
        "END:VEVENT",
        "BEGIN:VEVENT",
        "SUMMARY:Holiday",
        "DTSTART;VALUE=DATE:20261116",
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\r\n"),
    );
    await connect("google-calendar", ICS);

    const events = await server.call(
      `GET /api/workspaces/${id}/apps/events`,
      undefined,
      ada.cookie,
    );

    expect(events.body).toEqual({
      events: [
        { title: "Holiday", date: "2026-11-16", time: null },
        { title: "Launch review", date: "2026-11-20", time: "09:30" },
      ],
    });
  });

  it("disconnects an app, and answers only the workspace's members", async () => {
    const { server, id, connect } = await workspaceOfTwo();
    await connect("figma");
    const zed = await server.call("POST /api/account/sign-up", {
      email: "zed@pagecraft.test",
      password: "long enough",
      name: "Zed",
    });

    const outsider = await server.call(
      `GET /api/workspaces/${id}/apps`,
      undefined,
      zed.cookies?.[0],
    );
    const removed = await server.call(
      `POST /api/workspaces/${id}/apps/remove`,
      { app: "figma" },
      (
        await server.call("POST /api/account/sign-in", {
          email: "ada@pagecraft.test",
          password: "long enough",
        })
      ).cookies?.[0],
    );

    expect(outsider.status).toBe(404);
    expect(removed.body).toEqual({ apps: [] });
  });
});
