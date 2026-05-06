import { model } from "@medusajs/framework/utils";
import RepairTicket from "./repair-ticket";

const RepairNote = model.define("repair_note", {
  id: model.id().primaryKey(),

  // Repair ticket reference
  repair_ticket: model.belongsTo(() => RepairTicket, {
    mappedBy: "notes",
  }),

  // Note content
  content: model.text(),

  // Visibility control
  is_internal: model.boolean().default(false),

  // Author tracking
  author_id: model.text().nullable(),
  author_type: model.enum(["user", "customer"]).nullable(),

  // Metadata
  metadata: model.json().nullable(),
});

export default RepairNote;
