import { afterEach, describe, expect, it, vi } from "vitest";
import { createTestApp, defineCommand } from "../state/index.ts";
import { startPushSubscription } from "./push-client.ts";

// Signs in and turns push on or off, as the account and Settings do.
const setPush = defineCommand<{ isOn: boolean }>({
  type: "test.setPush",
  handle: (state, { isOn }) => ({
    ui: { ...state.ui, pushNotices: isOn },
    persistence: {
      ...state.persistence,
      account: { ...state.persistence.account, status: "signed-in" },
    },
  }),
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// One turn of the loop, for the subscription's promises to settle.
const settled = () =>
  new Promise<void>((done) => {
    setImmediate(done);
  });

function fakeBrowser() {
  const unsubscribe = vi.fn(() => Promise.resolve(true));
  const subscription = {
    endpoint: "https://push.example/me",
    unsubscribe,
    toJSON: () => ({
      endpoint: "https://push.example/me",
      keys: { p256dh: "key", auth: "secret" },
    }),
  };
  let current: typeof subscription | null = null;
  const pushManager = {
    getSubscription: () => Promise.resolve(current),
    subscribe: vi.fn(() => {
      current = subscription;
      return Promise.resolve(subscription);
    }),
  };
  vi.stubGlobal("PushManager", { supportedContentEncodings: ["aes128gcm"] });
  vi.stubGlobal("navigator", {
    serviceWorker: { ready: Promise.resolve({ pushManager }) },
  });
  return { pushManager, unsubscribe };
}

describe("the push subscription", () => {
  it("subscribes with the server's key when turned on, and drops it when off", async () => {
    const { pushManager, unsubscribe } = fakeBrowser();
    const asked: string[] = [];
    const send = (input: string | URL | Request, init?: RequestInit) => {
      const path = typeof input === "string" ? input : "";
      const body = typeof init?.body === "string" ? init.body : "";
      asked.push(`${path} ${body}`.trim());
      return Promise.resolve(
        new Response(JSON.stringify({ publicKey: "BPublicKey" })),
      );
    };
    const app = createTestApp({ commands: [setPush] });
    startPushSubscription({ store: app.store, send });

    app.dispatch(setPush.create({ isOn: true }));
    await settled();
    app.dispatch(setPush.create({ isOn: false }));
    await settled();

    expect(pushManager.subscribe).toHaveBeenCalledWith({
      userVisibleOnly: true,
      applicationServerKey: "BPublicKey",
    });
    expect(asked).toEqual([
      "/api/push/key",
      '/api/push/subscribe {"endpoint":"https://push.example/me","keys":{"p256dh":"key","auth":"secret"}}',
      '/api/push/unsubscribe {"endpoint":"https://push.example/me"}',
    ]);
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
