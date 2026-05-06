import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { REPAIR_MODULE } from "../../modules/repair";
import RepairModuleService from "../../modules/repair/service";

type ApproveRepairCostInput = {
  repair_ticket_id: string;
};

export const approveRepairCostStep = createStep(
  "approve-repair-cost",
  async (input: ApproveRepairCostInput, { container }) => {
    const repairService: RepairModuleService = container.resolve(REPAIR_MODULE);

    // Get current ticket for compensation
    const currentTicket = await repairService.retrieveRepairTicket(
      input.repair_ticket_id,
    );

    const updatedTicket = await repairService.updateRepairTickets({
      id: input.repair_ticket_id,
      is_approved: true,
      approved_at: new Date(),
    });

    return new StepResponse(updatedTicket, {
      repair_ticket_id: currentTicket.id,
      previous_is_approved: currentTicket.is_approved,
      previous_approved_at: currentTicket.approved_at,
    });
  },
  async (compensateInput, { container }) => {
    if (!compensateInput) return;
    const repairService: RepairModuleService = container.resolve(REPAIR_MODULE);

    await repairService.updateRepairTickets({
      id: compensateInput.repair_ticket_id,
      is_approved: compensateInput.previous_is_approved,
      approved_at: compensateInput.previous_approved_at,
    });
  },
);
