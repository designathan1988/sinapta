import { describe, expect, it } from "vitest";
import { createTestServer } from "./test-context.ts";

const EMAIL = "ada@pagecraft.test";

async function serverWithAda() {
  const clock = { now: Date.UTC(2026, 10, 14) };
  const server = createTestServer(clock);
  await server.call("POST /api/account/sign-up", {
    email: EMAIL,
    password: "long enough",
    name: "Ada",
  });
  const signIn = (password: string) =>
    server.call("POST /api/account/sign-in", { email: EMAIL, password });
  return { clock, signIn };
}

describe("wrong passwords", () => {
  it("hold an address back after five in fifteen minutes", async () => {
    const { signIn } = await serverWithAda();

    for (let tries = 0; tries < 5; tries += 1) await signIn("wrong one");
    const held = await signIn("long enough");

    expect(held.status).toBe(429);
    expect(held.body).toEqual({ error: "too-many-tries" });
  });

  it("let it in again once the oldest is fifteen minutes old", async () => {
    const { clock, signIn } = await serverWithAda();
    for (let tries = 0; tries < 5; tries += 1) await signIn("wrong one");

    clock.now += 15 * 60_000 + 1;
    const again = await signIn("long enough");

    expect(again.status).toBe(200);
  });

  it("are cleared by the right password", async () => {
    const { signIn } = await serverWithAda();
    for (let tries = 0; tries < 4; tries += 1) await signIn("wrong one");

    await signIn("long enough");
    const after = await Promise.all([
      signIn("wrong one"),
      signIn("long enough"),
    ]);

    expect(after.map((reply) => reply.status)).toEqual([401, 200]);
  });
});
