import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { REPAIR_MODULE } from "../../../../../modules/repair";
import RepairModuleService from "../../../../../modules/repair/service";

export async function POST(
  req: MedusaRequest<{
    estimated_completion?: string | null;
    technician_name?: string | null;
  }>,
  res: MedusaResponse,
) {
  const { estimated_completion, technician_name } = req.validatedBody;
  const repairService: RepairModuleService = req.scope.resolve(REPAIR_MODULE);

  const updatedTicket = await repairService.updateRepairTickets({
    id: req.params.id,
    estimated_completion: estimated_completion
      ? new Date(estimated_completion)
      : null,
    technician_name: technician_name || null,
  });

  res.json({
    repair_ticket: updatedTicket,
  });
}
