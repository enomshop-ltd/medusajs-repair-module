import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { approveRepairCostStep } from "./steps/approve-repair-cost"
import { updateRepairTicketStatusStep } from "./steps/update-repair-ticket-status"

type ApproveRepairCostWorkflowInput = {
  repair_ticket_id: string
}

export const approveRepairCostWorkflow = createWorkflow(
  "approve-repair-cost-workflow",
  function (input: ApproveRepairCostWorkflowInput) {
    const approvedTicket = approveRepairCostStep(input)

    // Automatically update status to "repairing" after approval
    const updatedTicket = updateRepairTicketStatusStep({
      repair_ticket_id: input.repair_ticket_id,
      status: "repairing",
    })

    return new WorkflowResponse({
      repairTicket: updatedTicket,
    })
  }
)
