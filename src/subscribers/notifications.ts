import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
  Modules,
} from "@medusajs/framework/utils";
import { getRepairTemplate } from "../utils/templates/repair";

const ACTIVE_CHANNELS = ["email", "sms", "whatsapp"];

export default async function globalNotificationHandler({
  event,
  container,
}: SubscriberArgs<any>) {
  const logger = container.resolve("logger");
  const eventName = event.name;
  const data = event.data;

  logger.info(`[Omni-Notify] 🟢 Triggered '${eventName}' subscriber.`);

  try {
    const notificationModuleService = container.resolve(
      ModuleRegistrationName.NOTIFICATION,
      { allowUnregistered: true },
    );
    if (!notificationModuleService) {
      logger.warn(
        `[Omni-Notify] ⚠️ Notification module not installed. Aborting.`,
      );
      return;
    }

    let targetEmail: string | null = null;
    let targetPhone: string | null = null;

    let baseTemplateName = "";
    let notificationSubject = "";
    let emailHtmlContent = "";
    let textContent = "";
    let notificationData: Record<string, any> = {};
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    let customerName = "Customer";

    // ---------------------------------------------------------
    // REPAIR EVENT FLOW
    // ---------------------------------------------------------
    if (eventName.startsWith("repair.")) {
      const ticketId = data.id || data.repair_ticket_id;
      if (!ticketId) {
        logger.warn(
          `[Omni-Notify] ⚠️ No ticket ID found in event data. Aborting.`,
        );
        return;
      }

      logger.debug(
        `[Omni-Notify] Retrieving ticket data for ID: ${ticketId}...`,
      );
      const { data: tickets } = await query.graph({
        entity: "repair_ticket",
        fields: ["*", "device.*"],
        filters: { id: ticketId },
      });

      if (!tickets || tickets.length === 0) {
        logger.warn(`[Omni-Notify] ⚠️ Repair ticket ${ticketId} not found`);
        return;
      }

      const ticket = tickets[0];
      const deviceModel = ticket.device?.model_name || "Device";
      const approvalUrl = ticket.approval_token
        ? `${process.env.STORE_URL || "http://localhost:3000"}/store/repairs/track?token=${ticket.approval_token}`
        : "";

      // Attempt to load customer details
      if (ticket.customer_id) {
        const customerModule = container.resolve(
          ModuleRegistrationName.CUSTOMER,
          { allowUnregistered: true },
        );
        if (customerModule) {
          const customer = await customerModule.retrieveCustomer(
            ticket.customer_id,
          );
          if (customer) {
            targetEmail = customer.email || null;
            targetPhone = customer.phone || null;
            customerName = customer.first_name || "Customer";
            notificationData.customer = customer;
          }
        }
      }

      // Populate base data
      notificationData = {
        ...notificationData,
        ticket_number: ticket.ticket_number,
        device: deviceModel,
        status: data.status || ticket.status,
        approval_url: approvalUrl,
        total_estimate:
          Number(
            (ticket.total_estimate as any)?.value ?? ticket.total_estimate,
          ) / 100,
      };

      if (eventName === "repair.status_changed") {
        baseTemplateName = "repair-status";
        notificationSubject = `Repair Status Update: ${deviceModel} (#${ticket.ticket_number})`;

        // Fire admin notification too
        if (notificationModuleService) {
          const adminTemplate = getRepairTemplate("admin-repair-status", {
            ...notificationData,
            customer_name: customerName,
          });
          logger.debug(`[Omni-Notify] 🛡️ Queuing internal Admin Notification`);
          notificationModuleService
            .createNotifications({
              to: "admin",
              channel: "admin",
              template: "admin-repair-status",
              content: {
                subject: `[Admin Alert] Status Changed: Ticket ${ticket.ticket_number}`,
                html: adminTemplate.html,
              },
              data: { ...notificationData, body: adminTemplate.text },
            })
            .catch((e) =>
              logger.warn(
                `[Omni-Notify] Admin notification failed: ${e.message}`,
              ),
            );
        }
      } else if (eventName === "repair.ticket.compliance_requested") {
        baseTemplateName = "repair-compliance";
        notificationSubject = `Action Required: Repair Ticket #${ticket.ticket_number}`;
        notificationData.compliance_url = approvalUrl;
      } else if (eventName === "repair.customer_reminder") {
        baseTemplateName = "repair-reminder";
        notificationSubject = `Reminder: Repair Ticket #${ticket.ticket_number}`;
        let nudgeMessage = "Please review the status of your repair.";
        if (ticket.status === "awaiting_approval") {
          nudgeMessage =
            "We are waiting for your approval to proceed with the repair.";
        } else if (ticket.status === "completed" || ticket.status === "ready") {
          nudgeMessage = "Your device is ready for pickup or payment.";
        }
        notificationData.nudge_message = nudgeMessage;
      }

      const template = getRepairTemplate(baseTemplateName, notificationData);
      emailHtmlContent = template.html;
      textContent = template.text;
    } else {
      logger.warn(`[Omni-Notify] ⚠️ Unmapped event '${eventName}'. Aborting.`);
      return;
    }

    // ---------------------------------------------------------
    // MULTI-CHANNEL DISPATCH PREPARATION
    // ---------------------------------------------------------
    if (!targetEmail && !targetPhone) {
      logger.warn(
        `[Omni-Notify] ⚠️ No contact methods (email/phone) found for event ${eventName}. Aborting.`,
      );
      return;
    }

    logger.debug(
      `[Omni-Notify] Preparing omni-channel dispatch for '${baseTemplateName}'...`,
    );
    const dispatches: Promise<any>[] = [];

    // 1. Queue Email
    if (ACTIVE_CHANNELS.includes("email") && targetEmail) {
      logger.debug(`[Omni-Notify] 📧 Queuing Email to ${targetEmail}`);
      dispatches.push(
        notificationModuleService.createNotifications({
          to: targetEmail,
          channel: "email",
          template: `${baseTemplateName}-email`,
          content: {
            subject: notificationSubject,
            html: emailHtmlContent,
          },
          data: notificationData,
        }),
      );
    }

    // 2. Queue SMS
    if (ACTIVE_CHANNELS.includes("sms") && targetPhone) {
      logger.debug(`[Omni-Notify] 📱 Queuing SMS to ${targetPhone}`);
      dispatches.push(
        notificationModuleService.createNotifications({
          to: targetPhone,
          channel: "sms",
          template: `${baseTemplateName}-sms`,
          data: {
            ...notificationData,
            body: textContent,
          },
        }),
      );
    }

    // 3. Queue WhatsApp
    if (ACTIVE_CHANNELS.includes("whatsapp") && targetPhone) {
      logger.debug(`[Omni-Notify] 💬 Queuing WhatsApp to ${targetPhone}`);
      dispatches.push(
        notificationModuleService.createNotifications({
          to: targetPhone,
          channel: "whatsapp",
          template: `${baseTemplateName}-whatsapp`,
          data: {
            ...notificationData,
            body: textContent,
          },
        }),
      );
    }

    await Promise.allSettled(dispatches);
    logger.info(
      `[Omni-Notify] ✅ Successfully executed ${dispatches.length} notification(s) for '${eventName}'.`,
    );
  } catch (error) {
    logger.error(`[Omni-Notify] ❌ Failed to process '${eventName}'`, error);
  }
}

export const config: SubscriberConfig = {
  event: [
    "repair.status_changed",
    "repair.ticket.compliance_requested",
    "repair.customer_reminder",
  ],
};
