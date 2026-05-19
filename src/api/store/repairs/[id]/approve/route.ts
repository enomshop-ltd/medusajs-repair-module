import type { AuthenticatedMedusaRequest, MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils";
import { REPAIR_MODULE } from "../../../../../modules/repair";
import RepairModuleService from "../../../../../modules/repair/service";
import { approveRepairCostWorkflow } from "../../../../../workflows/approve-repair-cost-workflow";

// POST /store/repairs/:id/approve - Approve repair cost
export async function POST(
  req: AuthenticatedMedusaRequest<{ id: string }>,
  res: MedusaResponse,
) {
  const { approved } = req.body as { approved?: boolean };
  const isApproved = approved ?? true;
  const customerId = req.auth_context?.actor_id;

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  
  // Fetch the ticket to verify ownership
  const { data: tickets } = await query.graph({
    entity: "repair_ticket",
    fields: ["id", "customer_id", "status"],
    filters: { id: req.params.id },
  });

  if (!tickets || tickets.length === 0) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Repair ticket not found");
  }

  const ticket = tickets[0];

  // Restrict to customer who owns the ticket
  if (ticket.customer_id && ticket.customer_id !== customerId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Unauthorized to approve this repair");
  } else if (!ticket.customer_id) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Cannot approve an anonymous ticket without a token");
  }

  // Only allow approval if it's in a state that requires approval
  if (ticket.status !== "awaiting_approval") {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Ticket is not awaiting approval");
  }

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
