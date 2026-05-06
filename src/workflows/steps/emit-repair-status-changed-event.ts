import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { Modules } from "@medusajs/framework/utils";

type EmitRepairStatusChangedInput = {
  repair_ticket_id: string;
  status: string;
  previous_status?: string;
};

export const emitRepairStatusChangedEventStep = createStep(
  "emit-repair-status-changed-event",
  async (input: EmitRepairStatusChangedInput, { container }) => {
    const eventBus = container.resolve(Modules.EVENT_BUS);

    await eventBus.emit({
      name: "repair.status_changed",
      data: input,
    });

    return new StepResponse({ emitted: true });
  },
);
