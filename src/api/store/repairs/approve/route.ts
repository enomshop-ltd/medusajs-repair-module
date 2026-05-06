import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils";
import { REPAIR_MODULE } from "../../../../modules/repair";
import RepairModuleService from "../../../../modules/repair/service";

// POST /store/repairs/approve
export async function POST(
  req: MedusaRequest<{ token: string; approved: boolean }>,
  res: MedusaResponse,
) {
  const { token, approved } = req.body;

  if (!token) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Token is required");
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const repairService: RepairModuleService = req.scope.resolve(REPAIR_MODULE);

  const { data: tickets } = await query.graph({
    entity: "repair_ticket",
    fields: ["*", "device.*"],
    filters: { approval_token: token },
  });

  if (!tickets || tickets.length === 0) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Invalid approval token",
    );
  }

  const ticket = tickets[0];

  // Only allow approval if it's in a state that requires approval
  if (ticket.status !== "awaiting_approval") {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Ticket is not awaiting approval",
    );
  }

  const newStatus = approved ? "repairing" : "cancelled";

  const updatedTicket = await repairService.updateRepairTickets({
    id: ticket.id,
    is_approved: approved,
    approved_at: approved ? new Date() : null,
    status: newStatus as any,
  });

  res.json({ ticket: updatedTicket });
}
