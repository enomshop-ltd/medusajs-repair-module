import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils";

export async function GET(
  req: MedusaRequest<{ token: string }>,
  res: MedusaResponse,
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { data: tickets } = await query.graph({
    entity: "repair_ticket",
    fields: ["*", "device.*"],
    filters: { approval_token: req.params.token },
  });

  if (!tickets || tickets.length === 0) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Invalid or expired token",
    );
  }

  res.json({ repair_ticket: tickets[0] });
}
