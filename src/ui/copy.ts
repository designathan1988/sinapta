// Every string the user can see or hear. Voice rules: docs/design-system.md.
// The text is kept in parts by area in src/ui/copy/; this file is the one
// place the rest of the app reads it from.
import {
  ACCOUNT_TEXT,
  AI_TEXT,
  AUTOMATION_TEXT,
  BLOCK_TEXT,
  CADENCE_TEXT,
  DATABASE_MENU_TEXT,
  DATABASE_OPTIONS_TEXT,
  DATABASE_TEXT,
  DATE_FORMAT_TEXT,
  DATE_TEXT,
  EDITOR_TEXT,
  INTEGRATION_TEXT,
  MOVE_TEXT,
  ONBOARDING_TEXT,
  PAGE_TEXT,
  PROPERTY_TEXT,
  SETTINGS_TEXT,
  SHARE_TEXT,
  SIDEBAR_VIEWS_TEXT,
  TEAMSPACE_TEXT,
  TEMPLATE_TEXT,
  VERIFY_TEXT,
  WORKSPACE_TEXT,
} from "./copy/index.ts";

export const PRODUCT_NAME = "Pagecraft";

export const COPY = {
  ...WORKSPACE_TEXT,
  ...DATE_TEXT,
  ...EDITOR_TEXT,
  ...PAGE_TEXT,
  ...BLOCK_TEXT,
  ...TEMPLATE_TEXT,
  ...SETTINGS_TEXT,
  ...SIDEBAR_VIEWS_TEXT,
  ...CADENCE_TEXT,
  ...AUTOMATION_TEXT,
  ...PROPERTY_TEXT,
  database: {
    ...DATABASE_TEXT.database,
    ...DATABASE_MENU_TEXT,
    ...DATABASE_OPTIONS_TEXT,
    ...DATE_FORMAT_TEXT,
  },
  onboarding: ONBOARDING_TEXT.onboarding,
  account: ACCOUNT_TEXT.account,
  share: SHARE_TEXT.share,
  ai: AI_TEXT.ai,
  verify: VERIFY_TEXT.verify,
  teamspace: TEAMSPACE_TEXT.teamspace,
  moveTo: MOVE_TEXT.moveTo,
  integration: INTEGRATION_TEXT.integration,
} as const;

export { pluralize } from "./copy/index.ts";
