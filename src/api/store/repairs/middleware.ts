import { MiddlewareRoute, validateAndTransformBody } from "@medusajs/framework";
import { z } from "@medusajs/framework/zod";

const AddMessageSchema = z.object({
  message: z.string(),
  token: z.string().optional(),
});

export const storeRepairMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/store/repairs/:id/messages",
    middlewares: [validateAndTransformBody(AddMessageSchema)],
  },
];
