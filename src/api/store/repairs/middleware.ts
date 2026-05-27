import { MiddlewareRoute, validateAndTransformBody } from "@medusajs/framework";
import { z } from "@medusajs/framework/zod";
import { authenticate } from "@medusajs/framework/http";

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
  {
    method: ["POST"],
    matcher: "/store/repairs/:id/approve",
    middlewares: [authenticate("customer", ["session", "bearer"])],
  },
  {
    method: ["POST"],
    matcher: "/store/repairs/:id/compliance",
    middlewares: [authenticate("customer", ["session", "bearer"])],
  }
];