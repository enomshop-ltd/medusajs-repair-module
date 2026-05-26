import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { Modules } from "@medusajs/framework/utils";

type EmitComplianceRequestedInput = {
  ticket_id: string;
  terms_accepted: boolean;
};

export const emitComplianceRequestedEventStep = createStep(
  "emit-compliance-requested-event",
  async (input: EmitComplianceRequestedInput, { container }) => {
    if (!input.terms_accepted) {
      const eventBus = container.resolve(Modules.EVENT_BUS);
      await eventBus.emit({
        name: "repair.ticket.compliance_requested",
        data: { id: input.ticket_id },
      });
      return new StepResponse({ emitted: true });
    }
    return new StepResponse({ emitted: false });
  },
);
