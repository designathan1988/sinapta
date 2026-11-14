// Notion's Connections and its integrations, in its English words.
export const INTEGRATION_TEXT = {
  integration: {
    section: "Connections",
    lead: "Integrations reach the pages you connect to them, through Pagecraft's API at /v1, as Notion's API does.",
    nameLabel: "Integration name",
    namePlaceholder: "e.g. Weekly report",
    create: "New integration",
    secretTitle: "Internal integration secret",
    secretHint:
      'Copy it now: it is shown only once. Send it as "Authorization: Bearer <secret>".',
    copy: "Copy",
    copied: "Secret copied",
    columnName: "Integration",
    columnPages: "Connected pages",
    remove: "Remove",
    none: "No integrations yet.",
    signedOut: "Sign in to a Pagecraft server to make integrations.",
    menu: "Connections",
    menuEmpty: "No integrations. Make one in Settings › Connections.",
  },
  thirdParty: {
    title: "Connect apps",
    lead: "Notion's own connections run on Notion's servers. This local server cannot reach them, so they are shown here and cannot be turned on.",
    apps: ["Slack", "Google Drive", "GitHub", "Jira", "Figma", "Asana"],
    connect: "Connect",
    unavailable: "Needs Notion's servers",
  },
  plans: {
    title: "Plans",
    lead: "Every plan is free on this server: choosing one takes no payment. Each keeps Notion's limits on file size and page history.",
    current: "Current plan",
    upgrade: "Upgrade",
    downgrade: "Downgrade",
    price: "Free on this server",
    ownersOnly: "Only the workspace's owners can change its plan.",
    signedOut: "Sign in to a Pagecraft server to choose a workspace's plan.",
    names: {
      free: "Free",
      plus: "Plus",
      business: "Business",
      enterprise: "Enterprise",
    },
    summaries: {
      free: "For one person's notes and projects.",
      plus: "For small teams working together.",
      business: "For growing teams and companies.",
      enterprise: "For whole organizations.",
    },
    upload: (megabytes: number) => `Files up to ${String(megabytes)} MB`,
    history: (days: number | null) =>
      days === null
        ? "All of page history"
        : `${String(days)} days of page history`,
  },
} as const;
