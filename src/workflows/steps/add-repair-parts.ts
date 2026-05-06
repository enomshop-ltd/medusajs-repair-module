import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { REPAIR_MODULE } from "../../modules/repair";
import RepairModuleService from "../../modules/repair/service";

type AddRepairPartsInput = {
  repair_ticket_id: string;
  variant_ids: string[];
  customer_id?: string;
  region_id?: string;
};

export const addRepairPartsStep = createStep(
  "add-repair-parts",
  async (input: AddRepairPartsInput, { container }) => {
    const link = container.resolve(ContainerRegistrationKeys.LINK);
    const repairService: RepairModuleService = container.resolve(REPAIR_MODULE);
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    // Create links between repair ticket and product variants
    const linkData = input.variant_ids.map((variantId) => ({
      repair_ticket: { repair_ticket_id: input.repair_ticket_id },
      product_variant: { product_variant_id: variantId },
    }));

    await link.create(linkData);

    // Fetch prices for the variants respecting customer price groups
    if (input.customer_id && input.region_id) {
      const { data: variantsWithPrices } = await query.graph({
        entity: "product_variant",
        fields: ["id", "calculated_price.*", "calculated_price.price_list.*"],
        filters: {
          id: input.variant_ids,
        },
        context: {
          region_id: input.region_id,
          customer_id: input.customer_id,
        },
      });

      // Store price data for display
      const priceMetadata = variantsWithPrices?.reduce(
        (acc: any, variant: any) => {
          acc[variant.id] = {
            calculated_price: variant.calculated_price?.calculated_amount,
            price_list_id: variant.calculated_price?.price_list?.id,
            price_list_name: variant.calculated_price?.price_list?.name,
          };
          return acc;
        },
        {},
      );

      return new StepResponse(
        {
          repair_ticket_id: input.repair_ticket_id,
          variant_ids: input.variant_ids,
          price_metadata: priceMetadata,
        },
        linkData,
      );
    }

    return new StepResponse(
      {
        repair_ticket_id: input.repair_ticket_id,
        variant_ids: input.variant_ids,
      },
      linkData,
    );
  },
  async (linkData, { container }) => {
    if (!linkData) return;
    const link = container.resolve(ContainerRegistrationKeys.LINK);
    await link.dismiss(linkData);
  },
);
