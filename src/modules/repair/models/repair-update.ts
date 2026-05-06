import { model } from "@medusajs/framework/utils";
import RepairTicket from "./repair-ticket";

const RepairUpdate = model.define("repair_update", {
  id: model.id().primaryKey(),

  // Repair ticket reference
  repair_ticket: model.belongsTo(() => RepairTicket, {
    mappedBy: "updates",
  }),

  // Message content
  message: model.text(),

  // Author tracking
  author_id: model.text().nullable(),
  author_type: model.enum(["user", "customer"]).nullable(),

  // Read status
  is_read: model.boolean().default(false),

  // Metadata
  metadata: model.json().nullable(),
});

export default RepairUpdate;
