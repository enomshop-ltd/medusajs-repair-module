import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { REPAIR_MODULE } from "../../modules/repair";
import RepairModuleService from "../../modules/repair/service";

type AddRepairMediaInput = {
  repair_ticket_id: string;
  file_url: string;
  file_name: string;
  file_type: "image" | "video";
  mime_type?: string;
  file_size?: number;
  description?: string;
};

export const addRepairMediaStep = createStep(
  "add-repair-media",
  async (input: AddRepairMediaInput, { container }) => {
    const repairService: RepairModuleService = container.resolve(REPAIR_MODULE);

    const media = await repairService.createRepairMedias(input);

    return new StepResponse(media, media.id);
  },
  async (mediaId, { container }) => {
    if (!mediaId) return;
    const repairService: RepairModuleService = container.resolve(REPAIR_MODULE);
    await repairService.deleteRepairMedias(mediaId);
  },
);
