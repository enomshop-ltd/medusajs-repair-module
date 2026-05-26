import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
  Modules,
} from "@medusajs/framework/utils";
import { REPAIR_MODULE } from "../modules/repair";
import RepairModuleService from "../modules/repair/service";

type RepairStatusChangedData = {
  repair_ticket_id: string;
  status: string;
  previous_status?: string;
};

export default async function repairStatusChangedHandler({
  event: { data },
  container,
}: SubscriberArgs<RepairStatusChangedData>) {
  const logger = container.resolve("logger");
  const repairService: RepairModuleService = container.resolve(REPAIR_MODULE);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  logger.info(
    `Repair ticket ${data.repair_ticket_id} status changed to ${data.status}`,
  );

  // Fetch the repair ticket details along with parts
  const { data: tickets } = await query.graph({
    entity: "repair_ticket",
    fields: [
      "*",
      "device.*",
      "product_variant.*",
      "product_variant.inventory_items.*", // Resolve inventory items
    ],
    filters: { id: data.repair_ticket_id },
  });

  if (!tickets || tickets.length === 0) {
    logger.warn(`Repair ticket ${data.repair_ticket_id} not found`);
    return;
  }

  const ticket = tickets[0];

  // Auto-deduct parts when repair is completed
  if (data.status === "completed" && data.previous_status !== "completed") {
    logger.info(
      `Processing part deductions for completed repair ticket ${ticket.ticket_number}`,
    );
    try {
      const inventoryModule = container.resolve(
        ModuleRegistrationName.INVENTORY,
        { allowUnregistered: true },
      );
      if (
        inventoryModule &&
        ticket.product_variant &&
        ticket.product_variant.length > 0
      ) {
        for (const part of ticket.product_variant) {
          if (part.inventory_items && part.inventory_items.length > 0) {
            for (const itemLink of part.inventory_items) {
              // We retrieve the inventory levels for this item
              const [levels, count] =
                await inventoryModule.listAndCountInventoryLevels({
                  inventory_item_id: itemLink.inventory_item_id,
                });

              if (levels && levels.length > 0) {
                // Deduct from the first available location
                const levelToAdjust = levels[0];
                const qtyToDeduct = itemLink.required_quantity || 1;

                await inventoryModule.updateInventoryLevels([
                  {
                    inventory_item_id: levelToAdjust.inventory_item_id,
                    location_id: levelToAdjust.location_id,
                    stocked_quantity:
                      levelToAdjust.stocked_quantity - qtyToDeduct,
                  } as any,
                ]);

                logger.info(
                  `Deducted ${qtyToDeduct} from inventory item ${levelToAdjust.inventory_item_id} (Variant: ${part.title})`,
                );
              }
            }
          } else {
            logger.warn(
              `Product variant ${part.title} (${part.id}) has no inventory items linked.`,
            );
          }

          // Delete associated reservation
          const [reservations] =
            await inventoryModule.listAndCountReservationItems({
              line_item_id: `repair_${ticket.id}_${part.id}`,
            });

          if (reservations?.length) {
            await inventoryModule.deleteReservationItems(
              reservations.map((r: any) => r.id),
            );
            logger.info(`Cleared reservation for variant ${part.title}`);
          }
        }
      } else if (!inventoryModule) {
        logger.warn("Inventory module not registered, skipping auto-deduct.");
      } else {
        logger.info(
          `No parts to deduct for repair ticket ${ticket.ticket_number}.`,
        );
      }
    } catch (err) {
      logger.error(
        `Error auto-deducting parts for repair ticket ${ticket.ticket_number}: ${err}`,
      );
    }
  }

  // Notifications are now handled by the Omni-Notify subscriber in notifications.ts
  logger.info(
    `Processed event for repair ticket ${ticket.ticket_number} - Status: ${data.status}`,
  );
}

export const config: SubscriberConfig = {
  event: "repair.status_changed",
};
