import RepairModuleService from "./service";
import { Module } from "@medusajs/framework/utils";

export const REPAIR_MODULE = "repair";

export default Module(REPAIR_MODULE, {
  service: RepairModuleService,
});
