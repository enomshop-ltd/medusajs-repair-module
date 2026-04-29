import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createDeviceStep } from "./steps/create-device"
import { createRepairTicketStep } from "./steps/create-repair-ticket"

type CreateRepairTicketWorkflowInput = {
  device: {
    serial_number: string
    model_name: string
    brand: string
    customer_id?: string
    imei?: string
    condition?: string
  }
  ticket: {
    customer_id?: string
    issue_description: string
    accessories?: string
  }
}

export const createRepairTicketWorkflow = createWorkflow(
  "create-repair-ticket-workflow",
  function (input: CreateRepairTicketWorkflowInput) {
    const device = createDeviceStep(input.device)

    const repairTicket = createRepairTicketStep({
      device_id: device.id,
      customer_id: input.ticket.customer_id,
      issue_description: input.ticket.issue_description,
      accessories: input.ticket.accessories,
    })

    return new WorkflowResponse({
      device,
      repairTicket,
    })
  }
)
