import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { MedusaError } from "@medusajs/framework/utils";
import { createRepairTicketWorkflow } from "../../../workflows/create-repair-ticket-workflow";

export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
) {
  const logger = req.scope.resolve("logger");
  const customerId = req.auth_context?.actor_id;

  logger.info(
    `[Store/Repairs] 🟢 Initiating repair booking for customer: ${customerId || "Unauthenticated"}`,
  );

  if (!customerId) {
    logger.warn(
      `[Store/Repairs] ⚠️ Unauthorized access attempt to book repair.`,
    );
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "You must be logged in to book a repair",
    );
  }

  const { device, ticket } = req.body as any;

  if (!device || !ticket) {
    logger.warn(
      `[Store/Repairs] ⚠️ Missing device or ticket details in payload.`,
    );
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Device and ticket details are required",
    );
  }

  logger.debug(
    `[Store/Repairs] Payload received. Device: ${device.brand} ${device.model_name}`,
  );
  logger.debug(`[Store/Repairs] Issue: ${ticket.issue_description}`);

  // Force the customer ID on both device and ticket to be the logged in user
  const inputDevice = { ...device, customer_id: customerId };
  const inputTicket = { ...ticket, customer_id: customerId };

  try {
    const { result } = await createRepairTicketWorkflow(req.scope).run({
      input: {
        device: inputDevice,
        ticket: inputTicket,
      },
    });

    logger.info(
      `[Store/Repairs] ✅ Successfully created repair ticket: ${result.repairTicket.ticket_number}`,
    );

    res.json({
      repair_ticket: result.repairTicket,
      device: result.device,
    });
  } catch (error: any) {
    logger.error(`[Store/Repairs] ❌ Failed to create repair ticket`, error);
    throw error;
  }
}
