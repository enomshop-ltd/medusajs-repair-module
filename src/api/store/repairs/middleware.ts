import { MiddlewareRoute, validateAndTransformBody } from "@medusajs/framework"
import { z } from "@medusajs/framework/zod"

const AddMessageSchema = z.object({
  message: z.string(),
})

export const storeRepairMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/store/repairs/:id/messages",
    middlewares: [validateAndTransformBody(AddMessageSchema)],
  },
]
