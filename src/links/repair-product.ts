import { defineLink } from "@medusajs/framework/utils";
import RepairModule from "../modules/repair";
import ProductModule from "@medusajs/medusa/product";

// Link RepairTicket to ProductVariant (for parts selection)
// A repair ticket can have many product variants (parts)
export default defineLink(RepairModule.linkable.repairTicket, {
  linkable: ProductModule.linkable.productVariant,
  isList: true,
});
