import type { AuthenticatedMedusaRequest, MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  MedusaError,
  ContainerRegistrationKeys,
} from "@medusajs/framework/utils";

// GET /store/customers/me/repairs - Get all repairs for logged-in customer
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const customerId = req.auth_context?.actor_id;

  if (!customerId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "You must be logged in to view your repairs",
    );
  }

  // Find all repair tickets for this customer
  const { data: tickets } = await query.graph({
    entity: "repair_ticket",
    fields: ["*", "device.*", "media.*", "notes.*", "updates.*"],
    filters: { customer_id: customerId },
  });

  // Filter out internal notes for customer view
  const formattedTickets = tickets.map((ticket: any) => ({
    ...ticket,
    notes: ticket.notes?.filter((note: any) => !note.is_internal) || [],
  }));

  res.json({
    repair_tickets: formattedTickets,
  });
}
