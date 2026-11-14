// The apps Settings › Connections offers, as Notion lists them, and how
// each connects to a server of one's own: Notion's connections sign in
// through each company's servers with Notion's own registration, which
// this server cannot use, so each app connects the way it lets anyone in.
//   webhook  - a channel's incoming-webhook address receives the notices.
//   calendar - a calendar's private iCal address; its events show on Home.
//   mail     - the page menu's "Email page" opens a draft in the mail app.
//   links    - links to the app are previewed when pasted.
export type AppKind = "webhook" | "calendar" | "mail" | "links";

export interface AppSpec {
  readonly id: string;
  readonly name: string;
  readonly kind: AppKind;
  // The hosts whose links a "links" app previews.
  readonly hosts: readonly string[];
}

export const APP_SPECS: readonly AppSpec[] = [
  { id: "gmail", name: "Gmail", kind: "mail", hosts: [] },
  {
    id: "google-calendar",
    name: "Google Calendar",
    kind: "calendar",
    hosts: [],
  },
  { id: "slack", name: "Slack", kind: "webhook", hosts: [] },
  { id: "outlook", name: "Outlook", kind: "calendar", hosts: [] },
  { id: "icloud", name: "iCloud", kind: "calendar", hosts: [] },
  { id: "asana", name: "Asana", kind: "links", hosts: ["app.asana.com"] },
  { id: "github", name: "GitHub", kind: "links", hosts: ["github.com"] },
  { id: "jira", name: "Jira", kind: "links", hosts: ["atlassian.net"] },
  { id: "figma", name: "Figma", kind: "links", hosts: ["figma.com"] },
  {
    id: "google-drive",
    name: "Google Drive",
    kind: "links",
    hosts: ["drive.google.com", "docs.google.com"],
  },
];

export const APP_IDS = APP_SPECS.map((spec) => spec.id);

export function appSpec(id: string): AppSpec | undefined {
  return APP_SPECS.find((spec) => spec.id === id);
}

// Whether an app needs an address to connect: a webhook or a calendar.
export function needsAddress(spec: AppSpec): boolean {
  return spec.kind === "webhook" || spec.kind === "calendar";
}

// The "links" app a link belongs to, by its host or a host above it.
export function appOfLink(href: string): AppSpec | undefined {
  const host = URL.parse(href)?.hostname;
  if (host === undefined) return undefined;
  return APP_SPECS.find((spec) =>
    spec.hosts.some((each) => host === each || host.endsWith(`.${each}`)),
  );
}
