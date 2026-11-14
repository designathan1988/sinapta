// Notion's notices on a person's other devices, by Web Push (ADR-0013):
// each browser that turns them on in Settings › Notifications gives the
// server a subscription; a mention of the person or a page shared with
// them is pushed to every one of their browsers, open or not.
import webpush from "web-push";
import * as v from "valibot";
import { answer, type ApiContext, type RouteTable } from "./api.ts";
import { readRow, readRows } from "./rows.schema.ts";
import { sessionUser } from "./sessions.ts";

export interface PushKeys {
  readonly publicKey: string;
  readonly privateKey: string;
}

export interface Subscription {
  readonly endpoint: string;
  readonly keys: { readonly p256dh: string; readonly auth: string };
}

export interface Notice {
  readonly title: string;
  readonly body: string;
  readonly url: string;
}

// Sends one notice; rejects with the push service's status code when the
// subscription is gone.
export type PushSender = (
  subscription: Subscription,
  payload: string,
  keys: PushKeys,
) => Promise<void>;

export const webPushSender: PushSender = async (
  subscription,
  payload,
  keys,
) => {
  await webpush.sendNotification(subscription, payload, {
    vapidDetails: {
      subject: "mailto:pagecraft@localhost",
      publicKey: keys.publicKey,
      privateKey: keys.privateKey,
    },
  });
};

const keyRowSchema = v.object({
  public_key: v.string(),
  private_key: v.string(),
});
const subscriptionRowSchema = v.object({
  endpoint: v.string(),
  p256dh: v.string(),
  auth: v.string(),
});

// The server's keys, made on first use.
export function pushKeys(context: ApiContext): PushKeys {
  const { db } = context;
  const row = readRow(
    keyRowSchema,
    db
      .prepare("SELECT public_key, private_key FROM push_keys WHERE id = 1")
      .get(),
  );
  if (row !== undefined) {
    return { publicKey: row.public_key, privateKey: row.private_key };
  }
  const made = webpush.generateVAPIDKeys();
  db.prepare(
    "INSERT INTO push_keys (id, public_key, private_key) VALUES (1, ?, ?)",
  ).run(made.publicKey, made.privateKey);
  return made;
}

function subscriptionsOf(context: ApiContext, userId: string): Subscription[] {
  const rows = context.db
    .prepare(
      "SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?",
    )
    .all(userId);
  return readRows(subscriptionRowSchema, rows).map((row) => ({
    endpoint: row.endpoint,
    keys: { p256dh: row.p256dh, auth: row.auth },
  }));
}

function statusOf(error: unknown): number {
  if (typeof error !== "object" || error === null) return 0;
  const status: unknown = Reflect.get(error, "statusCode");
  return typeof status === "number" ? status : 0;
}

// Pushes the notice to each of the people's browsers; a subscription the
// push service no longer knows is forgotten.
export async function pushNotice(
  context: ApiContext,
  userIds: readonly string[],
  notice: Notice,
): Promise<void> {
  const send = context.push;
  if (send === undefined || userIds.length === 0) return;
  const keys = pushKeys(context);
  const payload = JSON.stringify(notice);
  const all = userIds.flatMap((userId) => subscriptionsOf(context, userId));
  await Promise.all(
    all.map((subscription) =>
      send(subscription, payload, keys).catch((error: unknown) => {
        const status = statusOf(error);
        if (status === 404 || status === 410) {
          context.db
            .prepare("DELETE FROM push_subscriptions WHERE endpoint = ?")
            .run(subscription.endpoint);
        } else context.log(`push: ${String(error)}`);
      }),
    ),
  );
}

const subscribeSchema = v.object({
  endpoint: v.pipe(v.string(), v.url(), v.startsWith("https://")),
  keys: v.object({
    p256dh: v.pipe(v.string(), v.minLength(1)),
    auth: v.pipe(v.string(), v.minLength(1)),
  }),
});

export const PUSH_ROUTES: RouteTable = {
  "GET /api/push/key": (_request, context) =>
    answer(200, { publicKey: pushKeys(context).publicKey }),
  "POST /api/push/subscribe": (request, context) => {
    const user = sessionUser(context, request);
    if (user === undefined) return answer(401, { error: "signed-out" });
    const { endpoint, keys } = v.parse(subscribeSchema, request.body);
    context.db
      .prepare(
        "INSERT OR REPLACE INTO push_subscriptions (endpoint, user_id, p256dh, auth, created_at) VALUES (?, ?, ?, ?, ?)",
      )
      .run(endpoint, user.id, keys.p256dh, keys.auth, context.now());
    return answer(204);
  },
  "POST /api/push/unsubscribe": (request, context) => {
    const user = sessionUser(context, request);
    if (user === undefined) return answer(401, { error: "signed-out" });
    const { endpoint } = v.parse(
      v.object({ endpoint: v.string() }),
      request.body,
    );
    context.db
      .prepare(
        "DELETE FROM push_subscriptions WHERE endpoint = ? AND user_id = ?",
      )
      .run(endpoint, user.id);
    return answer(204);
  },
};
