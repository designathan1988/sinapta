// A database automation, as Notion's: when a page is added to the
// database, or when one of its pages has a property edited, Edit property
// sets values on that page ({ today: true } is the day it runs), and Add
// page to adds a page to a database, and Send webhook posts the page.
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
  // Add page to (version 31): the database a new, empty page is added to.
  addPageTo: v.optional(v.string()),
  // Send webhook (version 32): the address the page is posted to.
  webhookUrl: v.optional(v.string()),
  // Send Slack notification (version 33): to the workspace's connected
  // Slack.
  sendsSlack: v.optional(v.boolean()),
  // Send notification to (version 34): the people told in their inbox.
  notifyUserIds: v.optional(v.array(v.string())),
});

export type Automation = v.InferOutput<typeof automationSchema>;
export type AutomationTrigger = Automation["trigger"];
