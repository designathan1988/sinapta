// A database automation, as Notion's: when a page is added to the
// database, or when one of its pages has a property edited, Edit property
// sets values on that page ({ today: true } is the day it runs).
import * as v from "valibot";
import { propertyIdSchema } from "../../model/index.ts";

export const automationTriggerSchema = v.variant("kind", [
  v.object({ kind: v.literal("page-added") }),
  v.object({
    kind: v.literal("property-edited"),
    propertyId: propertyIdSchema,
  }),
]);

export const automationSchema = v.object({
  id: v.string(),
  isActive: v.boolean(),
  trigger: automationTriggerSchema,
  // Property id to the value the page takes.
  values: v.record(v.string(), v.unknown()),
});

export type Automation = v.InferOutput<typeof automationSchema>;
export type AutomationTrigger = Automation["trigger"];
