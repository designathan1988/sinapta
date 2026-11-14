import { describe, expect, it } from "vitest";
import { createEmptyWorkspace, SCHEMA_VERSION } from "../src/model/index.ts";
import { createTestServer } from "./test-context.ts";

const VISA = {
  number: "4242 4242 4242 4242",
  expMonth: 12,
  expYear: 2030,
  cvc: "123",
  name: "Ada Lovelace",
};

function field(body: unknown, key: string): unknown {
  return typeof body === "object" && body !== null && key in body
    ? Object.entries(body).find(([name]) => name === key)?.[1]
    : undefined;
}

async function workspaceOfTwo() {
  const server = createTestServer();
  const signUp = async (email: string) => {
    const reply = await server.call("POST /api/account/sign-up", {
      email,
      password: "long enough",
      name: email,
    });
    return reply.cookies?.[0] ?? "";
  };
  const ada = await signUp("ada@pagecraft.test");
  const bia = await signUp("bia@pagecraft.test");
  const snapshot = {
    schemaVersion: SCHEMA_VERSION,
    rootIds: [],
    blocks: {},
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
  const base = `/api/workspaces/${id}`;
  return { server, base, ada, bia };
}

describe("a workspace's card", () => {
  it("keeps only the brand, the last four digits and the expiry", async () => {
    const { server, base, ada } = await workspaceOfTwo();

    const added = await server.call(`POST ${base}/billing/card`, VISA, ada);

    expect(added.status).toBe(200);
    expect(field(added.body, "card")).toEqual({
      brand: "visa",
      last4: "4242",
      expMonth: 12,
      expYear: 2030,
      name: "Ada Lovelace",
    });
    expect(
      JSON.stringify(
        server.context.db.prepare("SELECT * FROM payment_methods").all(),
      ),
    ).not.toContain("4242424242424242");
  });

  it("refuses a number that fails its checksum, or an expired card", async () => {
    const { server, base, ada } = await workspaceOfTwo();

    const wrong = await server.call(
      `POST ${base}/billing/card`,
      { ...VISA, number: "4242 4242 4242 4241" },
      ada,
    );
    const expired = await server.call(
      `POST ${base}/billing/card`,
      { ...VISA, expYear: 2025 },
      ada,
    );

    expect(wrong).toMatchObject({
      status: 400,
      body: { error: "invalid-card" },
    });
    expect(expired).toMatchObject({
      status: 400,
      body: { error: "expired-card" },
    });
  });

  it("is refused when the bank declines it", async () => {
    const { server, base, ada } = await workspaceOfTwo();

    const declined = await server.call(
      `POST ${base}/billing/card`,
      { ...VISA, number: "4000 0000 0000 0002" },
      ada,
    );

    expect(declined).toMatchObject({
      status: 402,
      body: { error: "card-declined" },
    });
  });

  it("is the owner's to change", async () => {
    const { server, base, bia } = await workspaceOfTwo();

    const refused = await server.call(`POST ${base}/billing/card`, VISA, bia);

    expect(refused.status).toBe(403);
  });
});

describe("upgrading", () => {
  it("needs a card for a paid plan", async () => {
    const { server, base, ada } = await workspaceOfTwo();

    const refused = await server.call(
      `POST ${base}/plan`,
      { plan: "plus" },
      ada,
    );

    expect(refused).toMatchObject({
      status: 402,
      body: { error: "payment-required" },
    });
  });

  it("charges the card each member's price and keeps the invoice", async () => {
    const { server, base, ada } = await workspaceOfTwo();
    await server.call(`POST ${base}/billing/card`, VISA, ada);

    const upgraded = await server.call(
      `POST ${base}/plan`,
      { plan: "business" },
      ada,
    );
    const billing = await server.call(`GET ${base}/billing`, undefined, ada);

    expect(upgraded.status).toBe(204);
    expect(field(billing.body, "invoices")).toEqual([
      expect.objectContaining({
        plan: "business",
        seats: 2,
        amountCents: 4800,
        currency: "usd",
        status: "paid",
        last4: "4242",
      }),
    ]);
  });

  it("keeps the plan when the charge is declined", async () => {
    const { server, base, ada } = await workspaceOfTwo();
    await server.call(
      `POST ${base}/billing/card`,
      { ...VISA, number: "4000 0000 0000 0341" },
      ada,
    );

    const refused = await server.call(
      `POST ${base}/plan`,
      { plan: "plus" },
      ada,
    );
    const billing = await server.call(`GET ${base}/billing`, undefined, ada);

    expect(refused).toMatchObject({
      status: 402,
      body: { error: "card-declined" },
    });
    expect(field(billing.body, "plan")).toBe("free");
    expect(field(billing.body, "invoices")).toEqual([
      expect.objectContaining({ plan: "plus", status: "failed" }),
    ]);
  });

  it("moves down to Free without a charge", async () => {
    const { server, base, ada } = await workspaceOfTwo();
    await server.call(`POST ${base}/billing/card`, VISA, ada);
    await server.call(`POST ${base}/plan`, { plan: "plus" }, ada);

    const down = await server.call(`POST ${base}/plan`, { plan: "free" }, ada);
    const billing = await server.call(`GET ${base}/billing`, undefined, ada);

    expect(down.status).toBe(204);
    expect(field(billing.body, "invoices")).toHaveLength(1);
  });
});
