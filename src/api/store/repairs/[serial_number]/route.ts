import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  MedusaError,
  ContainerRegistrationKeys,
} from "@medusajs/framework/utils";

// GET /store/repairs/:serial_number - Track repair by ticket number or serial number
export async function GET(
  req: MedusaRequest<{ serial_number: string }>,
  res: MedusaResponse,
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const logger = req.scope.resolve("logger");
  const encodedIdentifier = req.params.serial_number || req.params.id || req.params[0] || (req.url.split('/').pop());
  const identifier = decodeURIComponent(encodedIdentifier || "").trim();

  logger.info(`[Store/Repairs] Tracking search initiated. Identifier: "${identifier}", Encoded: "${encodedIdentifier}"`);

  if (!identifier) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Identifier is missing");
  }

  let ticketsByNumber: any[] = [];
  try {
    const result = await query.graph({
      entity: "repair_ticket",
      fields: ["*", "device.*", "media.*", "notes.*", "updates.*"],
      filters: { ticket_number: identifier },
    });
    ticketsByNumber = result.data || [];
  } catch (error: any) {
    logger.warn(`[Store/Repairs] Error querying ticket_number: ${error.message}`);
  }

  if (ticketsByNumber.length > 0) {
    const ticket = ticketsByNumber[0];
    let parts = [];
    try {
      const { data: ticketWithParts } = await query.graph({
        entity: "repair_ticket",
        fields: ["id", "product_variants.*", "product_variants.product.*"],
        filters: { id: ticket.id },
      });
      parts = ticketWithParts?.[0]?.product_variants || [];
    } catch (e) {
      try {
        const { data: ticketWithParts } = await query.graph({
          entity: "repair_ticket",
          fields: ["id", "product_variant.*", "product_variant.product.*"],
          filters: { id: ticket.id },
        });
        parts = ticketWithParts?.[0]?.product_variant || [];
      } catch (err2) {}
    }

    const fullPayload = {
      ...ticket,
      parts,
      notes: ticket.notes?.filter((note: any) => !note.is_internal) || [],
    };
    return res.json({ repair_ticket: fullPayload });
  }

  let devices: any[] = [];
  try {
    const result = await query.graph({
      entity: "device",
      fields: ["*", "repair_tickets.*"],
      filters: { serial_number: identifier },
    });
    devices = result.data || [];
  } catch (error: any) {
    logger.warn(`[Store/Repairs] Error querying serial_number: ${error.message}`);
  }

  if (devices.length === 0) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Trackable item with identifier ${identifier} not found`,
    );
  }

  const device = devices[0];

  let tickets: any[] = [];
  try {
    const result = await query.graph({
      entity: "repair_ticket",
      fields: ["*", "device.*", "media.*", "notes.*", "updates.*"],
      filters: { device_id: device.id },
    });
    tickets = result.data || [];
  } catch (error: any) {
    logger.warn(`[Store/Repairs] Error querying tickets for device: ${error.message}`);
  }

  if (tickets.length === 0) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `No repair tickets found for device ${identifier}`,
    );
  }

  // Get most recent ticket
  const latestTicket = tickets.sort(
    (a: any, b: any) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )[0];

  let parts = [];
  try {
    const { data: ticketWithParts } = await query.graph({
      entity: "repair_ticket",
      fields: ["id", "product_variants.*", "product_variants.product.*"],
      filters: { id: latestTicket.id },
    });
    parts = ticketWithParts?.[0]?.product_variants || [];
  } catch (e) {
    try {
      const { data: ticketWithParts } = await query.graph({
        entity: "repair_ticket",
        fields: ["id", "product_variant.*", "product_variant.product.*"],
        filters: { id: latestTicket.id },
      });
      parts = ticketWithParts?.[0]?.product_variant || [];
    } catch (err2) {}
  }

  const fullPayload = {
    ...latestTicket,
    parts,
    notes: latestTicket.notes?.filter((note: any) => !note.is_internal) || [],
  };

  // Filter out internal notes in array
  const ticketsWithFilteredNotes = tickets.map((ticket: any) => ({
    ...ticket,
    notes: ticket.notes?.filter((note: any) => !note.is_internal) || [],
  }));

  res.json({
    device,
    repair_ticket: fullPayload,
    repair_tickets: ticketsWithFilteredNotes,
  });
}
