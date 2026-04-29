import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { REPAIR_MODULE } from "../modules/repair"
import RepairModuleService from "../modules/repair/service"

type RepairStatusChangedData = {
  repair_ticket_id: string
  status: string
  previous_status?: string
}

export default async function repairStatusChangedHandler({
  event: { data },
  container,
}: SubscriberArgs<RepairStatusChangedData>) {
  const logger = container.resolve("logger")
  const repairService: RepairModuleService = container.resolve(REPAIR_MODULE)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  logger.info(
    `Repair ticket ${data.repair_ticket_id} status changed to ${data.status}`
  )

  // Fetch the repair ticket details
  const { data: tickets } = await query.graph({
    entity: "repair_ticket",
    fields: ["*", "device.*"],
    filters: { id: data.repair_ticket_id },
  })

  if (!tickets || tickets.length === 0) {
    logger.warn(`Repair ticket ${data.repair_ticket_id} not found`)
    return
  }

  const ticket = tickets[0]

  // Here you can add notification logic
  // For example, send SMS or WhatsApp message
  // Example:
  // const notificationService = container.resolve("notification")
  // await notificationService.sendNotification({
  //   to: ticket.customer_id,
  //   template: "repair-status-updated",
  //   data: {
  //     ticket_number: ticket.ticket_number,
  //     status: data.status,
  //     device: ticket.device.model_name,
  //   }
  // })

  logger.info(
    `Notification sent for repair ticket ${ticket.ticket_number} - Status: ${data.status}`
  )
}

export const config: SubscriberConfig = {
  event: "repair.status_changed",
}
