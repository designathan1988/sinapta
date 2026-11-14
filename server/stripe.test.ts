import { describe, expect, it } from "vitest";
import { createEmptyWorkspace, SCHEMA_VERSION } from "../src/model/index.ts";
import { stripeProcessor, type StripeWeb } from "./stripe.ts";
import { createTestServer } from "./test-context.ts";

function field(body: unknown, key: string): unknown {
  return typeof body === "object" && body !== null && key in body
    ? Object.entries(body).find(([name]) => name === key)?.[1]
    : undefined;
}

const SAVED = {
  status: "complete",
  customer: "cus_1",
  setup_intent: {
    payment_method: {
      id: "pm_1",
      billing_details: { name: "Ada Lovelace" },
      card: { brand: "visa", last4: "4242", exp_month: 12, exp_year: 2030 },
    },
  },
};

// Stripe's API as a test sees it: each post kept, answers set by path.
function fakeStripe(payment: { status: string } | undefined) {
  const posts: { path: string; fields: Record<string, string> }[] = [];
  let workspace = "";
  const web: StripeWeb = {
    post(path, fields) {
      posts.push({ path, fields: { ...fields } });
      if (path === "/v1/customers") {
        workspace = fields["metadata[workspace]"] ?? "";
        return Promise.resolve({ id: "cus_1" });
      }
      if (path === "/v1/checkout/sessions") {
        return Promise.resolve({
          id: "cs_1",
          url: "https://checkout.stripe.com/c/cs_1",
        });
      }
      return Promise.resolve(payment && { id: "pi_1", ...payment });
    },
    get: (path) =>
      Promise.resolve(
        path.startsWith("/v1/checkout/sessions/cs_1")
          ? { ...SAVED, metadata: { workspace } }
          : undefined,
      ),
  };
  return { posts, web };
}

async function stripeWorkspace(payment: { status: string } | undefined) {
  const stripe = fakeStripe(payment);
  const server = createTestServer(undefined, stripeProcessor(stripe.web));
  const reply = await server.call("POST /api/account/sign-up", {
    email: "ada@pagecraft.test",
    password: "long enough",
    name: "Ada",
  });
  const ada = reply.cookies?.[0] ?? "";
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
  return { server, stripe, ada, base: `/api/workspaces/${id}` };
}

describe("Stripe as the payment processor", () => {
  it("sends the owner to Stripe Checkout to save a card, its number never here", async () => {
    const { server, stripe, ada, base } = await stripeWorkspace(undefined);

    const typed = await server.call(
      `POST ${base}/billing/card`,
      { number: "4242424242424242" },
      ada,
    );
    const sent = await server.call(
      `GET ${base}/billing/checkout`,
      undefined,
      ada,
    );

    expect(typed).toMatchObject({
      status: 409,
      body: { error: "hosted-checkout" },
    });
    expect(sent).toMatchObject({
      status: 302,
      location: "https://checkout.stripe.com/c/cs_1",
    });
    expect(stripe.posts[1]).toMatchObject({
      path: "/v1/checkout/sessions",
      fields: {
        mode: "setup",
        customer: "cus_1",
        success_url:
          "http://pagecraft.test/api/billing/checkout/return?session_id={CHECKOUT_SESSION_ID}",
      },
    });
  });

  it("keeps the card Stripe saved once the owner comes back", async () => {
    const { server, ada, base } = await stripeWorkspace(undefined);
    await server.call(`GET ${base}/billing/checkout`, undefined, ada);

    const back = await server.call(
      "GET /api/billing/checkout/return?session_id=cs_1",
      undefined,
      ada,
    );
    const billing = await server.call(`GET ${base}/billing`, undefined, ada);

    expect(back).toMatchObject({ status: 302, location: "/?billing=saved" });
    expect(billing.body).toMatchObject({
      processor: "stripe",
      card: {
        brand: "visa",
        last4: "4242",
        expMonth: 12,
        expYear: 2030,
        name: "Ada Lovelace",
      },
    });
  });

  it("charges the saved card off session through Stripe when upgrading", async () => {
    const { server, stripe, ada, base } = await stripeWorkspace({
      status: "succeeded",
    });
    await server.call(`GET ${base}/billing/checkout`, undefined, ada);
    await server.call(
      "GET /api/billing/checkout/return?session_id=cs_1",
      undefined,
      ada,
    );

    const upgraded = await server.call(
      `POST ${base}/plan`,
      { plan: "plus" },
      ada,
    );

    expect(upgraded.status).toBe(204);
    expect(stripe.posts.at(-1)).toEqual({
      path: "/v1/payment_intents",
      fields: {
        amount: "1200",
        currency: "usd",
        customer: "cus_1",
        payment_method: "pm_1",
        off_session: "true",
        confirm: "true",
      },
    });
  });

  it("keeps the plan when Stripe declines the charge", async () => {
    const { server, ada, base } = await stripeWorkspace(undefined);
    await server.call(`GET ${base}/billing/checkout`, undefined, ada);
    await server.call(
      "GET /api/billing/checkout/return?session_id=cs_1",
      undefined,
      ada,
    );

    const refused = await server.call(
      `POST ${base}/plan`,
      { plan: "plus" },
      ada,
    );

    expect(refused).toMatchObject({
      status: 402,
      body: { error: "card-declined" },
    });
  });
});
