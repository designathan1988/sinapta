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
} as const;
