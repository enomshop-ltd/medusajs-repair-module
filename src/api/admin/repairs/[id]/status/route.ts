import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { updateRepairStatusWorkflow } from "../../../../../workflows/update-repair-status-workflow"

// POST /admin/repairs/:id/status - Update repair status
export async function POST(
  req: MedusaRequest<{ id: string }>,
  res: MedusaResponse
) {
  const { status, estimated_completion, previous_status } = req.validatedBody

  const { result } = await updateRepairStatusWorkflow(req.scope).run({
    input: {
      repair_ticket_id: req.params.id,
      status,
      estimated_completion: estimated_completion ? new Date(estimated_completion) : undefined,
      previous_status,
    },
  })

  res.json({
    repair_ticket: result.repairTicket,
  })
}
