// Every string the user can see or hear. Voice rules: docs/design-system.md.
// The text is kept in parts by area in src/ui/copy/; this file is the one
// place the rest of the app reads it from.
import {
  BLOCK_TEXT,
  DATABASE_MENU_TEXT,
  DATABASE_OPTIONS_TEXT,
  DATABASE_TEXT,
  DATE_TEXT,
  EDITOR_TEXT,
  ONBOARDING_TEXT,
  PAGE_TEXT,
  SETTINGS_TEXT,
  TEMPLATE_TEXT,
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
  database: {
    ...DATABASE_TEXT.database,
    ...DATABASE_MENU_TEXT,
    ...DATABASE_OPTIONS_TEXT,
  },
  onboarding: ONBOARDING_TEXT.onboarding,
} as const;

export { pluralize } from "./copy/index.ts";
