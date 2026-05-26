import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import RepairModuleService from "../../../../../modules/repair/service";
import { REPAIR_MODULE } from "../../../../../modules/repair";

// POST /admin/repairs/:id/custom-parts - Add a custom part
export async function POST(
  req: MedusaRequest<{ name: string; price: number }>,
  res: MedusaResponse,
) {
  const repairService: RepairModuleService = req.scope.resolve(REPAIR_MODULE);
  const { name, price } = req.body as { name: string; price: number };

  if (!name || price === undefined) {
    res
      .status(400)
      .json({ message: "Name and price are required for custom parts" });
    return;
  }

  const ticket = await repairService.retrieveRepairTicket(req.params.id);

  // Initialize if null somehow, though model sets default []
  const customParts = Array.isArray(ticket.custom_parts)
    ? [...ticket.custom_parts]
    : [];

  const priceInCents = Math.round(Number(price) * 100);
  customParts.push({ name, price: priceInCents });

  // also update parts estimate
  const currentPartsEstimate =
    typeof ticket.parts_estimate === "object" &&
    ticket.parts_estimate !== null &&
    "value" in ticket.parts_estimate
      ? Number((ticket.parts_estimate as any).value)
      : Number(ticket.parts_estimate);

  const currentLaborEstimate =
    typeof ticket.labor_estimate === "object" &&
    ticket.labor_estimate !== null &&
    "value" in ticket.labor_estimate
      ? Number((ticket.labor_estimate as any).value)
      : Number(ticket.labor_estimate);

  const updatedPartsEstimate = currentPartsEstimate + priceInCents;

  const updatedTicket = await repairService.updateRepairTickets({
    id: req.params.id,
    custom_parts: customParts as unknown as Record<string, unknown>,
    parts_estimate: updatedPartsEstimate,
    total_estimate: updatedPartsEstimate + currentLaborEstimate,
  });

  res.json({ repair_ticket: updatedTicket });
}
