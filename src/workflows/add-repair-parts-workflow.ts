import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { addRepairPartsStep } from "./steps/add-repair-parts";

type AddRepairPartsWorkflowInput = {
  repair_ticket_id: string;
  variant_ids: string[];
};

export const addRepairPartsWorkflow = createWorkflow(
  "add-repair-parts-workflow",
  function (input: AddRepairPartsWorkflowInput) {
    const result = addRepairPartsStep(input);

    return new WorkflowResponse(result);
  },
);
