import { defineMiddlewares } from "@medusajs/framework/http"
import { repairMiddlewares } from "./admin/repairs/middlewares"
import { storeRepairMiddlewares } from "./store/repairs/middlewares"

export default defineMiddlewares({
  routes: [...repairMiddlewares, ...storeRepairMiddlewares],
})
