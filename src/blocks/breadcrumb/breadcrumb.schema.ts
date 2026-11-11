import * as v from "valibot";

export const BREADCRUMB_TYPE = "breadcrumb";

// Holds nothing: its trail is derived from the pages around its page.
export const breadcrumbPropsSchema = v.object({});
