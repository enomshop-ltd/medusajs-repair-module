import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { REPAIR_MODULE } from "../../modules/repair";
import RepairModuleService from "../../modules/repair/service";

type AddRepairNoteInput = {
  repair_ticket_id: string;
  content: string;
  is_internal: boolean;
  author_id?: string;
  author_type?: "user" | "customer";
};

export const addRepairNoteStep = createStep(
  "add-repair-note",
  async (input: AddRepairNoteInput, { container }) => {
    const repairService: RepairModuleService = container.resolve(REPAIR_MODULE);

    const note = await repairService.createRepairNotes(input);

    return new StepResponse(note, note.id);
  },
  async (noteId, { container }) => {
    if (!noteId) return;
    const repairService: RepairModuleService = container.resolve(REPAIR_MODULE);
    await repairService.deleteRepairNotes(noteId);
  },
);
