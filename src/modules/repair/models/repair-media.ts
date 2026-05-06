import { model } from "@medusajs/framework/utils";
import RepairTicket from "./repair-ticket";

const RepairMedia = model.define("repair_media", {
  id: model.id().primaryKey(),

  // Repair ticket reference
  repair_ticket: model.belongsTo(() => RepairTicket, {
    mappedBy: "media",
  }),

  // File details
  file_url: model.text(),
  file_name: model.text(),
  file_type: model.enum(["image", "video"]).default("image"),
  mime_type: model.text().nullable(),
  file_size: model.number().nullable(),

  // Description
  description: model.text().nullable(),

  // Metadata
  metadata: model.json().nullable(),
});

export default RepairMedia;
