import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

// GET /admin/repairs/:id/document?type=job_card | receipt
export async function GET(
  req: MedusaRequest<{ id: string }>,
  res: MedusaResponse,
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const type = req.query.type || "job_card";

  // Fetch ticket details
  const { data: tickets } = await query.graph({
    entity: "repair_ticket",
    fields: ["*", "device.*", "product_variant.*"],
    filters: { id: [req.params.id] },
  });

  if (!tickets || tickets.length === 0) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Repair ticket not found",
    );
  }

  const ticket = tickets[0];

  // Try to find customer email/details
  let customerName = "Guest";
  if (ticket.customer_id) {
    try {
      const customerModule = req.scope.resolve("customer", {
        allowUnregistered: true,
      });
      if (customerModule) {
        const customer = await customerModule.retrieveCustomer(
          ticket.customer_id,
        );
        if (customer) {
          customerName = customer.first_name
            ? `${customer.first_name} ${customer.last_name || ""}`
            : customer.email || "Customer";
        }
      }
    } catch (e) {
      // ignore
    }
  }

  // Calculate costs properly
  const tTotal =
    typeof ticket.total_estimate === "object" &&
    ticket.total_estimate !== null &&
    "value" in ticket.total_estimate
      ? Number((ticket.total_estimate as any).value)
      : Number(ticket.total_estimate);

  const partsCost =
    typeof ticket.parts_estimate === "object" &&
    ticket.parts_estimate !== null &&
    "value" in ticket.parts_estimate
      ? Number((ticket.parts_estimate as any).value)
      : Number(ticket.parts_estimate);

  const laborCost =
    typeof ticket.labor_estimate === "object" &&
    ticket.labor_estimate !== null &&
    "value" in ticket.labor_estimate
      ? Number((ticket.labor_estimate as any).value)
      : Number(ticket.labor_estimate);

  // Generate QR code as Buffer
  // E.g., link to track repair status or just ticket text
  const qrUrl = `${process.env.STORE_URL || "http://localhost:3000"}/store/repairs/track?number=${ticket.ticket_number}`;
  const qrBuffer = await QRCode.toBuffer(qrUrl, {
    errorCorrectionLevel: "H",
    type: "png",
    margin: 1,
    width: 100,
  });

  const doc = new PDFDocument({ margin: 50 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${ticket.ticket_number}-${type}.pdf"`,
  );

  doc.pipe(res);

  // Header
  doc
    .fontSize(20)
    .text(type === "job_card" ? "REPAIR JOB CARD" : "REPAIR RECEIPT", {
      align: "center",
    });
  doc.moveDown();

  // Top metadata row
  const startX = 50;
  const topY = doc.y;

  // Left col: Company & Ticket Info
  doc
    .fontSize(12)
    .text(
      type === "job_card" ? "EnomShop Repairs" : "EnomShop Receipt",
      startX,
      topY,
    );
  doc.fontSize(10).text(`Ticket Number: ${ticket.ticket_number}`);
  doc.text(`Date Created: ${new Date(ticket.created_at).toLocaleDateString()}`);
  doc.text(`Status: ${String(ticket.status).toUpperCase()}`);

  // Right col: QR Code
  doc.image(qrBuffer, doc.page.width - 150, topY, { width: 100 });
  tempY(doc);

  // Customer & Device Info
  doc.moveDown(2);
  doc.fontSize(14).text("Customer & Device Details", { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(10);
  doc.text(`Customer: ${customerName}`);
  if (ticket.device) {
    doc.text(`Device: ${ticket.device.brand} ${ticket.device.model_name}`);
    doc.text(`Serial Number: ${ticket.device.serial_number}`);
  } else {
    doc.text(`Device: Unknown`);
  }
  doc.moveDown();

  // Issue & Accessories
  doc.fontSize(14).text("Issue Description", { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(10).text(ticket.issue_description || "No description provided.");
  if (ticket.accessories) {
    doc.moveDown();
    doc.fontSize(12).text("Included Accessories:", { underline: true });
    doc.fontSize(10).text(ticket.accessories);
  }

  doc.moveDown();
  doc.fontSize(12).text("Legal & Compliance:", { underline: true });
  doc
    .fontSize(10)
    .text(
      `Terms & Conditions Accepted: ${ticket.terms_accepted ? "Yes" : "No"}`,
    );
  doc.text(`Data Wipe Consent: ${ticket.data_wiped_consent ? "Yes" : "No"}`);

  doc.moveDown(2);

  // Parts List
  if (ticket.product_variant && ticket.product_variant.length > 0) {
    doc.fontSize(14).text("Inventory Parts Used", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    for (const p of ticket.product_variant) {
      doc.text(`- ${p.title} (SKU: ${p.sku || "N/A"})`);
    }
    doc.moveDown();
  }

  if (
    ticket.custom_parts &&
    Array.isArray(ticket.custom_parts) &&
    ticket.custom_parts.length > 0
  ) {
    doc.fontSize(14).text("Custom Parts", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    for (const cp of ticket.custom_parts) {
      doc.text(`- ${cp.name} : $${cp.price.toFixed(2)}`);
    }
    doc.moveDown();
  }

  // Cost Breakdown
  if (type === "receipt" || type === "job_card") {
    doc.fontSize(14).text("Cost Breakdown", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12);
    doc.text(
      `Parts Subtotal: $${(partsCost / 100).toFixed(2)}\nLabor Subtotal: $${(laborCost / 100).toFixed(2)}`,
    );
    doc.moveDown(0.5);
    doc
      .fontSize(14)
      .text(`Total Amount: $${(tTotal / 100).toFixed(2)}`, { stroke: true });
    doc.moveDown();
  }

  // Signature Block
  if (type === "job_card") {
    doc.moveDown(3);
    const signatureY = doc.y;
    doc.moveTo(50, signatureY).lineTo(250, signatureY).stroke();
    doc.fontSize(10).text("Technician Signature", 50, signatureY + 5);

    doc.moveTo(350, signatureY).lineTo(550, signatureY).stroke();
    doc.text("Customer Signature", 350, signatureY + 5);
  } else {
    doc.moveDown(2);
    doc
      .font("Helvetica-Oblique")
      .fontSize(10)
      .text("Thank you for your business!", { align: "center" });
    doc.font("Helvetica");
  }

  doc.end();
}

function tempY(doc: any) {
  doc.y = Math.max(doc.y, 150); // Adjust layout past the top block
}
