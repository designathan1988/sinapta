// Text of Settings › Billing, as Notion's.
export const BILLING_TEXT = {
  billing: {
    title: "Billing",
    paymentMethod: "Payment method",
    noCard: "No payment method yet. Add a card to upgrade the workspace.",
    cardLine: (brand: string, last4: string) =>
      `${brand.toUpperCase()} •••• ${last4}`,
    expires: (month: number, year: number) =>
      `Expires ${String(month).padStart(2, "0")}/${String(year)}`,
    addCard: "Add card",
    replaceCard: "Replace card",
    removeCard: "Remove",
    cardNumber: "Card number",
    expiry: "Expiration (MM/YY)",
    cvc: "CVC",
    nameOnCard: "Name on card",
    saveCard: "Save card",
    invoices: "Invoices",
    noInvoices: "No invoices yet.",
    invoiceLine: (plan: string, seats: number) =>
      `${plan}, ${String(seats)} ${seats === 1 ? "member" : "members"}`,
    paid: "Paid",
    failed: "Failed",
    ownersOnly: "Only the workspace's owners can see and change its billing.",
    signedOut: "Log in to a Pagecraft server to pay for a workspace's plan.",
    errors: {
      "invalid-card": "That card number isn't valid.",
      "invalid-cvc": "Enter the 3 or 4 digits on the back of the card.",
      "expired-card": "That card has expired.",
      "card-declined": "The card was declined. Try another card.",
      "payment-required":
        "Add a payment method to upgrade. The upgrade goes through as soon as the card is saved.",
      "owners-only": "Only the workspace's owners can change its billing.",
    },
    stripeNote:
      "The card is typed on Stripe's secure page, and Stripe keeps it. Pagecraft keeps only its brand, last four digits and expiry.",
    processorNote:
      "Cards are checked and charged by this server's payment processor, which keeps only the card's brand, last four digits and expiry.",
  },
} as const;
