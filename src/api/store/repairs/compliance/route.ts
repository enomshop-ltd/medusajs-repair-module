import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils";
import { REPAIR_MODULE } from "../../../../modules/repair";
import RepairModuleService from "../../../../modules/repair/service";

export async function POST(
  req: MedusaRequest<{
    token: string;
    terms_accepted: boolean;
    data_wiped_consent?: boolean;
  }>,
  res: MedusaResponse,
) {
  const { token, terms_accepted, data_wiped_consent } = req.body;

  if (!token) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Token is required");
  }

  if (!terms_accepted) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Terms must be accepted",
    );
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const repairService: RepairModuleService = req.scope.resolve(REPAIR_MODULE);

  const { data: tickets } = await query.graph({
    entity: "repair_ticket",
    fields: ["*", "device.*"],
    filters: { approval_token: token },
  });

  if (!tickets || tickets.length === 0) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Invalid token");
  }

  const ticket = tickets[0];

  const updatedTicket = await repairService.updateRepairTickets({
    id: ticket.id,
    terms_accepted: !!terms_accepted,
    data_wiped_consent: !!data_wiped_consent,
  });

  res.json({ ticket: updatedTicket });
}
