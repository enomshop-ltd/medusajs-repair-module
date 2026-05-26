import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import type { AuthenticatedMedusaRequest } from "@medusajs/framework/http";
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils";
import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { addRepairUpdateStep } from "../../../../../workflows/steps/add-repair-update";

const addRepairUpdateWorkflow = createWorkflow(
  "add-repair-update-workflow-store",
  function (input: {
    repair_ticket_id: string;
    message: string;
    author_id?: string;
    author_type?: "user" | "customer";
  }) {
    const update = addRepairUpdateStep(input);
    return new WorkflowResponse({ update });
  },
);

// GET /store/repairs/:id/messages - Get messages for repair
export async function GET(
  req: AuthenticatedMedusaRequest<{ id: string }>,
  res: MedusaResponse,
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const customerId = req.auth_context?.actor_id;

  // Fetch the ticket to verify ownership
  const { data: tickets } = await query.graph({
    entity: "repair_ticket",
    fields: ["id", "customer_id"],
    filters: { id: req.params.id },
  });

  if (!tickets || tickets.length === 0) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Repair ticket not found",
    );
  }

  const ticket = tickets[0];

  // Restrict to customer who owns the ticket (if customer_id is set)
  if (ticket.customer_id && ticket.customer_id !== customerId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Unauthorized to view these messages",
    );
  }

  const { data } = await query.graph({
    entity: "repair_update",
    fields: ["*"],
    filters: { repair_ticket_id: req.params.id },
  });

  res.json({
    messages: data || [],
  });
}

// POST /store/repairs/:id/messages - Send message to repair chat
export async function POST(
  req: AuthenticatedMedusaRequest<{
    message: string;
    token?: string;
  }>,
  res: MedusaResponse,
) {
  const { message, token } = req.validatedBody;
  const customerId = req.auth_context?.actor_id;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  // Fetch the ticket to verify ownership or token validity
  const { data: tickets } = await query.graph({
    entity: "repair_ticket",
    fields: ["id", "customer_id", "approval_token"],
    filters: { id: req.params.id },
  });

  if (!tickets || tickets.length === 0) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Repair ticket not found",
    );
  }

  const ticket = tickets[0];
  let isAuthorized = false;

  // Check if authenticated as the correct customer
  if (customerId && ticket.customer_id === customerId) {
    isAuthorized = true;
  }

  // Check if token matches
  if (!isAuthorized && token && ticket.approval_token === token) {
    isAuthorized = true;
  }

  // If ticket has no customer AND no token was provided, it might be an anonymous ticket.
  // We'll allow it if customer_id is null, but ideally all tickets belong to a customer.
  if (!isAuthorized && !ticket.customer_id && !token) {
    isAuthorized = true;
  }

  if (!isAuthorized) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Unauthorized to post messages",
    );
  }

  const { result } = await addRepairUpdateWorkflow(req.scope).run({
    input: {
      repair_ticket_id: req.params.id,
      message,
      author_id: customerId,
      author_type: "customer",
    },
  });

  res.json({
    update: result.update,
  });
}
