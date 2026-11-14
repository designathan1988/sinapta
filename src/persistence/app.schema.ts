// The server's answers about connected apps, parsed at the boundary.
import * as v from "valibot";

const appsSchema = v.object({
  apps: v.array(v.object({ app: v.string(), host: v.nullable(v.string()) })),
});

const eventsSchema = v.object({
  events: v.array(
    v.object({
      title: v.string(),
      date: v.pipe(v.string(), v.isoDate()),
      time: v.nullable(v.string()),
    }),
  ),
});

export function readApps(value: unknown) {
  const parsed = v.safeParse(appsSchema, value);
  return parsed.success ? parsed.output.apps : undefined;
}

export function readEvents(value: unknown) {
  const parsed = v.safeParse(eventsSchema, value);
  return parsed.success ? parsed.output.events : undefined;
}
