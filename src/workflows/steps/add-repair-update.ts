import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { REPAIR_MODULE } from "../../modules/repair";
import RepairModuleService from "../../modules/repair/service";

type AddRepairUpdateInput = {
  repair_ticket_id: string;
  message: string;
  author_id?: string;
  author_type?: "user" | "customer";
};

export const addRepairUpdateStep = createStep(
  "add-repair-update",
  async (input: AddRepairUpdateInput, { container }) => {
    const repairService: RepairModuleService = container.resolve(REPAIR_MODULE);

    const update = await repairService.createRepairUpdates(input);

    return new StepResponse(update, update.id);
  },
  async (updateId, { container }) => {
    if (!updateId) return;
    const repairService: RepairModuleService = container.resolve(REPAIR_MODULE);
    await repairService.deleteRepairUpdates(updateId);
  },
);
