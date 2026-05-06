import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { REPAIR_MODULE } from "../../modules/repair";
import RepairModuleService from "../../modules/repair/service";

type CreateDeviceInput = {
  serial_number: string;
  model_name: string;
  brand: string;
  customer_id?: string;
  imei?: string;
  condition?: string;
  metadata?: Record<string, unknown>;
};

export const createDeviceStep = createStep(
  "create-device",
  async (input: CreateDeviceInput, { container }) => {
    const repairService: RepairModuleService = container.resolve(REPAIR_MODULE);

    const device = await repairService.createDevices(input);

    return new StepResponse(device, device.id);
  },
  async (deviceId, { container }) => {
    if (!deviceId) return;
    const repairService: RepairModuleService = container.resolve(REPAIR_MODULE);
    await repairService.deleteDevices(deviceId);
  },
);
