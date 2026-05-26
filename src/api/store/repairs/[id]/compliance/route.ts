import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils";
import { REPAIR_MODULE } from "../../../../../modules/repair";
import RepairModuleService from "../../../../../modules/repair/service";

export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
) {
  const { terms_accepted, data_wiped_consent } = req.body as any;
  const customerId = req.auth_context?.actor_id;

  if (!terms_accepted) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Terms must be accepted",
    );
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  // Fetch the ticket to verify ownership
  const { data: tickets } = await query.graph({
    entity: "repair_ticket",
    fields: ["id", "customer_id", "status"],
    filters: { id: req.params.id },
  });

  if (!tickets || tickets.length === 0) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Repair ticket not found",
    );
  }

  const ticket = tickets[0];

  if (ticket.customer_id && ticket.customer_id !== customerId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Unauthorized to accept compliance for this ticket",
    );
  } else if (!ticket.customer_id) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Cannot accept an anonymous ticket without a token",
    );
  }

  const repairService: RepairModuleService = req.scope.resolve(REPAIR_MODULE);
  const updatedTicket = await repairService.updateRepairTickets({
    id: req.params.id,
    terms_accepted: !!terms_accepted,
    data_wiped_consent: !!data_wiped_consent,
  });

  res.json({ ticket: updatedTicket });
}
