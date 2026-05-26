import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils";
import { generateRepairDocument } from "../../../../../utils/generate-repair-document";

// GET /store/repairs/:id/document?type=invoice | quote | receipt
export async function GET(
  req: AuthenticatedMedusaRequest<{ id: string }>,
  res: MedusaResponse,
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const type = (req.query.type as string) || "invoice";
  const customerId = req.auth_context?.actor_id;

  if (!customerId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "You must be logged in to access documents",
    );
  }

  // Fetch ticket details
  const { data: tickets } = await query.graph({
    entity: "repair_ticket",
    fields: [
      "*",
      "device.*",
      "product_variants.*",
      "product_variants.prices.*",
    ],
    filters: { id: [req.params.id], customer_id: customerId },
  });

  if (!tickets || tickets.length === 0) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Repair ticket not found",
    );
  }

  const ticket = tickets[0];
  const parts = ticket.product_variants || [];

  let customerName = "Customer";
  try {
    const customerModule = req.scope.resolve("customer", {
      allowUnregistered: true,
    });
    if (customerModule) {
      const customer = await customerModule.retrieveCustomer(
        ticket.customer_id,
      );
      if (customer) {
        customerName = customer.first_name
          ? `${customer.first_name} ${customer.last_name || ""}`
          : customer.email || "Customer";
      }
    }
  } catch (e) {}

  const payloadTicket = { ...ticket, parts };
  await generateRepairDocument(type, payloadTicket, customerName, res);
}
