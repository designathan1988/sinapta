import * as v from "valibot";

export const TABLE_OF_CONTENTS_TYPE = "table-of-contents";

// Holds nothing: its list is derived from the headings of its page.
export const tableOfContentsPropsSchema = v.object({});
