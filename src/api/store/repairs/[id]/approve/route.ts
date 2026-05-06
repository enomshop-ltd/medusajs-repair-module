import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils";
import { REPAIR_MODULE } from "../../../../../modules/repair";
import RepairModuleService from "../../../../../modules/repair/service";
import { approveRepairCostWorkflow } from "../../../../../workflows/approve-repair-cost-workflow";

// POST /store/repairs/:id/approve - Approve repair cost
export async function POST(
  req: MedusaRequest<{ id: string }>,
  res: MedusaResponse,
) {
  const { approved } = req.body as { approved?: boolean };
  const isApproved = approved ?? true;

  if (!isApproved) {
    // If declined, update directly
    const repairService: RepairModuleService = req.scope.resolve(REPAIR_MODULE);
    const updatedTicket = await repairService.updateRepairTickets({
      id: req.params.id,
      status: "cancelled" as any,
    });
    res.json({
      repair_ticket: updatedTicket,
      message: "Repair declined. Ticket cancelled.",
    });
    return;
  }

  // Use workflow for approval
  const { result } = await approveRepairCostWorkflow(req.scope).run({
    input: {
      repair_ticket_id: req.params.id,
    },
  });

  res.json({
    repair_ticket: result.repairTicket,
    message: "Repair cost approved successfully. Work will begin shortly.",
  });
}
