import { MedusaService } from "@medusajs/framework/utils";
import Device from "./models/device";
import RepairTicket from "./models/repair-ticket";
import RepairMedia from "./models/repair-media";
import RepairNote from "./models/repair-note";
import RepairUpdate from "./models/repair-update";

class RepairModuleService extends MedusaService({
  Device,
  RepairTicket,
  RepairMedia,
  RepairNote,
  RepairUpdate,
}) {}

export default RepairModuleService;
