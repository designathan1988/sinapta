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
    current: "Plan",
    currentValue: "Free, on your own server",
    currentHint:
      "Everything Pagecraft has is yours on this server; there is nothing to buy.",
    upgrade: "Upgrade",
    upgradeHint:
      "Payment is Notion's own service; this local server takes none.",
  },
} as const;
