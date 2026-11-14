// Notion's Verification property (ADR-0013): whether a row's page is
// verified, and until when, kept on the page by its menu's Verify.
import type { PropertyType } from "../../property-definition.ts";

interface Verification {
  readonly by: string;
  readonly until: string | null;
}

function readVerification(stored: unknown): Verification | undefined {
  if (typeof stored !== "object" || stored === null) return undefined;
  const fields = Object.fromEntries(Object.entries(stored));
  const { by, until } = fields;
  if (typeof by !== "string") return undefined;
  return { by, until: typeof until === "string" ? until : null };
}

const day = new Intl.DateTimeFormat("en-US", { dateStyle: "long" });

function formatVerification(value: unknown): string {
  const verification = readVerification(value);
  if (verification === undefined) return "";
  return verification.until === null
    ? "Verified"
    : `Verified until ${day.format(new Date(verification.until))}`;
}

export const verificationProperty: PropertyType = {
  type: "verification",
  label: "Verification",
  icon: "check",
  editor: "none",
  input: { type: "text" },
  computedFrom: "verification",
  read: readVerification,
  parse: () => undefined,
  format: formatVerification,
  compare: (a, b) => formatVerification(a).localeCompare(formatVerification(b)),
  filterOperators: [
    {
      id: "is-verified",
      label: "Is verified",
      needsOperand: false,
      test: (value) => readVerification(value) !== undefined,
    },
    {
      id: "is-not-verified",
      label: "Is not verified",
      needsOperand: false,
      test: (value) => readVerification(value) === undefined,
    },
  ],
  renderCell: formatVerification,
};
