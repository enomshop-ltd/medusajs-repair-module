import {
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"
import { REPAIR_MODULE } from "../../modules/repair"
import RepairModuleService from "../../modules/repair/service"

type CreateRepairTicketInput = {
  device_id: string
  customer_id?: string
  technician_id?: string
  technician_name?: string
  issue_description: string
  accessories?: string
  metadata?: Record<string, unknown>
}

export const createRepairTicketStep = createStep(
  "create-repair-ticket",
  async (input: CreateRepairTicketInput, { container }) => {
    const repairService: RepairModuleService = container.resolve(REPAIR_MODULE)

    // Generate unique ticket number
    const timestamp = Date.now()
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase()
    const ticket_number = `RT-${timestamp}-${randomPart}`

    const repairTicket = await repairService.createRepairTickets({
      ...input,
      ticket_number,
    })

    return new StepResponse(repairTicket, repairTicket.id)
  },
  async (ticketId, { container }) => {
    if (!ticketId) return
    const repairService: RepairModuleService = container.resolve(REPAIR_MODULE)
    await repairService.deleteRepairTickets(ticketId)
  }
)
