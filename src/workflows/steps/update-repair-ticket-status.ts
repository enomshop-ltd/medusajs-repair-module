import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { REPAIR_MODULE } from "../../modules/repair";
import RepairModuleService from "../../modules/repair/service";

type UpdateRepairTicketStatusInput = {
  repair_ticket_id: string;
  status:
    | "received"
    | "diagnosing"
    | "awaiting_approval"
    | "repairing"
    | "ready"
    | "completed"
    | "cancelled";
  estimated_completion?: Date;
};

export const updateRepairTicketStatusStep = createStep(
  "update-repair-ticket-status",
  async (input: UpdateRepairTicketStatusInput, { container }) => {
    const repairService: RepairModuleService = container.resolve(REPAIR_MODULE);

    // Get current ticket for compensation
    const currentTicket = await repairService.retrieveRepairTicket(
      input.repair_ticket_id,
    );

    const updateData: any = {
      status: input.status,
    };

    if (input.estimated_completion) {
      updateData.estimated_completion = input.estimated_completion;
    }

    // Set warranty expiry and completed_at when status changes to completed
    if (input.status === "completed" && !currentTicket.completed_at) {
      updateData.completed_at = new Date();

      // Calculate warranty expiry
      const warrantyExpiry = new Date();
      warrantyExpiry.setMonth(
        warrantyExpiry.getMonth() + currentTicket.warranty_months,
      );
      updateData.warranty_expiry = warrantyExpiry;
    }

    const updatedTicket = await repairService.updateRepairTickets({
      id: input.repair_ticket_id,
      ...updateData,
    });

    return new StepResponse(updatedTicket, {
      repair_ticket_id: currentTicket.id,
      previous_status: currentTicket.status,
      previous_estimated_completion: currentTicket.estimated_completion,
      previous_completed_at: currentTicket.completed_at,
      previous_warranty_expiry: currentTicket.warranty_expiry,
    });
  },
  async (compensateInput, { container }) => {
    if (!compensateInput) return;
    const repairService: RepairModuleService = container.resolve(REPAIR_MODULE);

    await repairService.updateRepairTickets({
      id: compensateInput.repair_ticket_id,
      status: compensateInput.previous_status,
      estimated_completion: compensateInput.previous_estimated_completion,
      completed_at: compensateInput.previous_completed_at,
      warranty_expiry: compensateInput.previous_warranty_expiry,
    });
  },
);
