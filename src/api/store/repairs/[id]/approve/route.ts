import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { approveRepairCostWorkflow } from "../../../../../workflows/approve-repair-cost-workflow"

// POST /store/repairs/:id/approve - Approve repair cost
export async function POST(
  req: MedusaRequest<{ id: string }>,
  res: MedusaResponse
) {
  const { result } = await approveRepairCostWorkflow(req.scope).run({
    input: {
      repair_ticket_id: req.params.id,
    },
  })

  res.json({
    repair_ticket: result.repairTicket,
    message: "Repair cost approved successfully. Work will begin shortly.",
  })
}
