import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  MedusaError,
  ContainerRegistrationKeys,
} from "@medusajs/framework/utils";

// GET /store/repairs/:serial_number - Track repair by serial number
export async function GET(
  req: MedusaRequest<{ serial_number: string }>,
  res: MedusaResponse,
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  // First find the device by serial number
  const { data: devices } = await query.graph({
    entity: "device",
    fields: ["id", "serial_number", "model_name", "brand"],
    filters: { serial_number: req.params.serial_number },
  });

  if (!devices || devices.length === 0) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Device with serial number ${req.params.serial_number} not found`,
    );
  }

  const device = devices[0];

  // Find all repair tickets for this device
  const { data: tickets } = await query.graph({
    entity: "repair_ticket",
    fields: ["*", "device.*", "media.*", "notes.*", "updates.*"],
    filters: { device_id: device.id },
  });

  // Filter out internal notes
  const ticketsWithFilteredNotes = tickets.map((ticket: any) => ({
    ...ticket,
    notes: ticket.notes?.filter((note: any) => !note.is_internal) || [],
  }));

  res.json({
    device,
    repair_tickets: ticketsWithFilteredNotes,
  });
}
