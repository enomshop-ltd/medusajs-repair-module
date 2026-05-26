import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { REPAIR_MODULE } from "../../../../modules/repair";
import RepairModuleService from "../../../../modules/repair/service";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { data: tickets } = await query.graph({
    entity: "repair_ticket",
    fields: ["*", "device.*"],
  });

  const totalRepairs = tickets.length;

  const statusCounts = tickets.reduce((acc: any, ticket) => {
    acc[ticket.status] = (acc[ticket.status] || 0) + 1;
    return acc;
  }, {});

  const totalExpectedRevenue = tickets.reduce((total: number, ticket: any) => {
    if (ticket.status !== "cancelled") {
      const val =
        typeof ticket.total_estimate === "object" &&
        ticket.total_estimate !== null &&
        "value" in ticket.total_estimate
          ? Number(ticket.total_estimate.value)
          : Number(ticket.total_estimate || 0);
      return total + val;
    }
    return total;
  }, 0);

  // Wait, let's also send back recent completed ones to calculate average repair time.
  const completedTickets = tickets.filter(
    (t) => t.status === "completed" && t.completed_at && t.created_at,
  );

  let avgRepairTimeMs = 0;
  if (completedTickets.length > 0) {
    const totalTime = completedTickets.reduce(
      (sum, t) =>
        sum +
        (new Date(t.completed_at).getTime() - new Date(t.created_at).getTime()),
      0,
    );
    avgRepairTimeMs = totalTime / completedTickets.length;
  }

  const monthlyRevenue = tickets.reduce((acc: any, ticket: any) => {
    if (ticket.status !== "cancelled") {
      const date = new Date(ticket.created_at);
      const monthYear = `${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`;

      const tParts =
        typeof ticket.parts_estimate === "object" &&
        ticket.parts_estimate !== null &&
        "value" in ticket.parts_estimate
          ? Number(ticket.parts_estimate.value)
          : Number(ticket.parts_estimate || 0);

      const tLabor =
        typeof ticket.labor_estimate === "object" &&
        ticket.labor_estimate !== null &&
        "value" in ticket.labor_estimate
          ? Number(ticket.labor_estimate.value)
          : Number(ticket.labor_estimate || 0);

      const tTotal =
        typeof ticket.total_estimate === "object" &&
        ticket.total_estimate !== null &&
        "value" in ticket.total_estimate
          ? Number(ticket.total_estimate.value)
          : Number(ticket.total_estimate || 0);

      let partsAmount = tParts;
      let laborAmount = tLabor;

      if (partsAmount === 0 && laborAmount === 0 && tTotal > 0) {
        partsAmount = tTotal; // Fallback for old tickets
      }

      if (!acc[monthYear]) {
        acc[monthYear] = {
          month: monthYear,
          partsRevenue: 0,
          laborRevenue: 0,
          totalRevenue: 0,
          timestamp: date.getTime(),
        };
      }

      acc[monthYear].partsRevenue += Number((partsAmount / 100).toFixed(2));
      acc[monthYear].laborRevenue += Number((laborAmount / 100).toFixed(2));
      acc[monthYear].totalRevenue += Number((tTotal / 100).toFixed(2));
    }
    return acc;
  }, {});

  const monthlyRevenueArray = Object.values(monthlyRevenue).sort(
    (a: any, b: any) => a.timestamp - b.timestamp,
  );

  res.json({
    analytics: {
      total_repairs: totalRepairs,
      status_counts: statusCounts,
      total_expected_revenue: totalExpectedRevenue,
      avg_repair_time_days: avgRepairTimeMs / (1000 * 60 * 60 * 24),
      completed_count: completedTickets.length,
      monthly_revenue: monthlyRevenueArray,
    },
  });
}
