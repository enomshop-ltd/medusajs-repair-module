import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  MedusaError,
  ContainerRegistrationKeys,
} from "@medusajs/framework/utils";

// GET /admin/repairs/:id - Get single repair ticket
export async function GET(
  req: MedusaRequest<{ id: string }>,
  res: MedusaResponse,
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { data } = await query.graph({
    entity: "repair_ticket",
    fields: ["*", "device.*", "media.*", "notes.*", "updates.*"],
    filters: { id: [req.params.id] },
  });

  if (!data || data.length === 0) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Repair ticket with id ${req.params.id} not found`,
    );
  }

  // Fetch linked product variants (parts)
  let parts = [];
  try {
    const linkQuery = req.scope.resolve(ContainerRegistrationKeys.QUERY);

    // First try with plural name which is standard for isList: true
    const { data: ticketWithParts } = await linkQuery.graph({
      entity: "repair_ticket",
      fields: ["id", "product_variants.*"],
      filters: { id: [req.params.id] },
    });
    parts = ticketWithParts?.[0]?.product_variants || [];
  } catch (err) {
    try {
      const linkQuery = req.scope.resolve(ContainerRegistrationKeys.QUERY);
      const { data: ticketWithParts } = await linkQuery.graph({
        entity: "repair_ticket",
        fields: ["id", "product_variant.*"],
        filters: { id: [req.params.id] },
      });
      parts = ticketWithParts?.[0]?.product_variant || [];
    } catch (err2) {
      // both failed, which means the link isn't established properly in query graph graph, return empty parts.
    }
  }

  res.json({
    repair_ticket: {
      ...data[0],
      parts,
    },
  });
}
