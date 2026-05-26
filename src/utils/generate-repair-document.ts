import { MedusaResponse } from "@medusajs/framework/http";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

export async function generateRepairDocument(
  docType: string,
  ticket: any,
  customerName: string,
  res: MedusaResponse,
) {
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

  // Generate QR code
  const qrUrl = `${process.env.STORE_URL || "http://localhost:3000"}/store/repairs/track?number=${ticket.ticket_number}`;
  const qrBuffer = await QRCode.toBuffer(qrUrl, {
    errorCorrectionLevel: "H",
    type: "png",
    margin: 1,
    width: 100,
  });

  const doc = new PDFDocument({ margin: 50, size: "A4" });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${ticket.ticket_number}-${docType}.pdf"`,
  );

  doc.pipe(res);

  let title = "REPAIR DOCUMENT";
  if (docType === "job_card") title = "REPAIR JOB CARD";
  else if (docType === "receipt") title = "REPAIR RECEIPT";
  else if (docType === "invoice") title = "TAX INVOICE";
  else if (docType === "quote") title = "REPAIR QUOTATION";

  // Header Details
  doc.fontSize(22).font("Helvetica-Bold").text(title, { align: "right" });
  doc.moveDown(1);
  const topY = doc.y;

  // Company info
  doc.fontSize(14).text("EnomShop Ltd.", 50, topY);
  doc
    .fontSize(10)
    .font("Helvetica")
    .text("123 Medusa Street, E-commerce City", 50, topY + 20);
  doc.text("support@enomshop.com", 50, topY + 35);
  doc.text("Phone: +1 234 567 890", 50, topY + 50);

  // Document metadata + QR Code
  doc.image(qrBuffer, 445, topY - 10, { width: 100 });

  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .text(`${docType.toUpperCase()} NO:`, 250, topY + 20);
  doc.font("Helvetica").text(ticket.ticket_number, 330, topY + 20);

  doc.font("Helvetica-Bold").text("DATE:", 250, topY + 35);
  doc
    .font("Helvetica")
    .text(new Date(ticket.created_at).toLocaleDateString(), 330, topY + 35);

  doc.font("Helvetica-Bold").text("STATUS:", 250, topY + 50);
  doc
    .font("Helvetica")
    .text(String(ticket.status).toUpperCase(), 330, topY + 50);

  doc.y = Math.max(doc.y, topY + 100);
  doc
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .lineWidth(1)
    .strokeColor("#cccccc")
    .stroke();
  doc.moveDown(2);

  // Customer & Device Box
  doc.fontSize(12).font("Helvetica-Bold").text("BILLED TO:", 50, doc.y);
  doc.font("Helvetica").fontSize(10);
  doc.text(`Customer: ${customerName}`, 50, doc.y + 5);

  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("DEVICE DETAILS:", 300, doc.y - 12);
  doc.font("Helvetica").fontSize(10);
  if (ticket.device) {
    doc.text(`Brand: ${ticket.device.brand}`, 300, doc.y - 2);
    doc.text(`Model: ${ticket.device.model_name}`, 300, doc.y);
    doc.text(`Serial No: ${ticket.device.serial_number}`, 300, doc.y);
  } else {
    doc.text(`Device: Unknown`, 300, doc.y - 2);
  }

  doc.moveDown(3);
  doc
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .lineWidth(1)
    .strokeColor("#eeeeee")
    .stroke();
  doc.moveDown(1);

  // Issue Description
  doc.fontSize(11).font("Helvetica-Bold").text("Issue Description:");
  doc
    .fontSize(10)
    .font("Helvetica")
    .text(ticket.issue_description || "No description provided.");
  if (ticket.accessories) {
    doc.moveDown(0.5);
    doc.fontSize(11).font("Helvetica-Bold").text("Included Accessories:");
    doc.fontSize(10).font("Helvetica").text(ticket.accessories);
  }

  doc.moveDown(2);

  // Line Items Section
  doc
    .fontSize(11)
    .font("Helvetica-Bold")
    .text("REPAIR DETAILS / LINE ITEMS:", 50, doc.y);
  doc.moveDown(1);

  // Draw Table Header
  const tableTop = doc.y;
  doc.rect(50, tableTop, 495, 25).fill("#f5f5f5");
  doc.fillColor("#333333").font("Helvetica-Bold").fontSize(10);
  doc.text("Description", 60, tableTop + 8);
  doc.text("Qty", 350, tableTop + 8, { width: 30, align: "center" });
  doc.text("Total", 450, tableTop + 8, { width: 80, align: "right" });

  let currentY = tableTop + 25;
  doc.fillColor("#000000").font("Helvetica").fontSize(10);

  // Custom Parts
  if (ticket.custom_parts && Array.isArray(ticket.custom_parts)) {
    for (const cp of ticket.custom_parts) {
      doc.text(cp.name, 60, currentY + 8);
      doc.text("1", 350, currentY + 8, { width: 30, align: "center" });
      doc.text(`$${(cp.price / 100).toFixed(2)}`, 450, currentY + 8, {
        width: 80,
        align: "right",
      });
      currentY += 25;
    }
  }

  // Inventory Parts
  if (ticket.parts && Array.isArray(ticket.parts)) {
    for (const p of ticket.parts) {
      doc.text(`${p.title} (SKU: ${p.sku || "N/A"})`, 60, currentY + 8);
      doc.text("1", 350, currentY + 8, { width: 30, align: "center" });
      const price = p.prices?.[0]?.amount || 0;
      doc.text(
        price ? `$${(price / 100).toFixed(2)}` : "TBD",
        450,
        currentY + 8,
        { width: 80, align: "right" },
      );
      currentY += 25;
    }
  }

  // Add Labor if non-zero
  if (laborCost > 0) {
    doc.text("Labor & Service Fee", 60, currentY + 8);
    doc.text("1", 350, currentY + 8, { width: 30, align: "center" });
    doc.text(`$${(laborCost / 100).toFixed(2)}`, 450, currentY + 8, {
      width: 80,
      align: "right",
    });
    currentY += 25;
  }

  if (currentY === tableTop + 25) {
    doc.text("No cost items added yet.", 60, currentY + 8);
    currentY += 25;
  }

  doc
    .moveTo(50, currentY)
    .lineTo(545, currentY)
    .strokeColor("#cccccc")
    .stroke();

  // Total Block
  doc.moveDown(2);
  const totalY = currentY + 20;

  if (docType === "invoice" || docType === "quote" || docType === "receipt") {
    doc.font("Helvetica-Bold").text("Subtotal:", 350, totalY);
    doc
      .font("Helvetica")
      .text(
        `$${(partsCost / 100).toFixed(2)} parts / $${(laborCost / 100).toFixed(2)} labor`,
        420,
        totalY,
        { align: "right", width: 110 },
      );

    doc.font("Helvetica-Bold").text("Total Amount:", 350, totalY + 20);
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .text(`$${(tTotal / 100).toFixed(2)}`, 450, totalY + 20, {
        align: "right",
        width: 80,
      });
  }

  // Footer / Signatures
  doc.moveDown(4);
  const signatureY = doc.y + (docType === "job_card" ? 20 : 0);

  if (docType === "job_card") {
    doc
      .moveTo(50, signatureY)
      .lineTo(250, signatureY)
      .strokeColor("#000000")
      .stroke();
    doc
      .fontSize(10)
      .font("Helvetica")
      .text("Technician Signature", 50, signatureY + 5);

    doc.moveTo(350, signatureY).lineTo(545, signatureY).stroke();
    doc.text("Customer Signature", 350, signatureY + 5);
  } else if (docType === "quote") {
    doc
      .font("Helvetica-Oblique")
      .fontSize(10)
      .text("This quote is valid for 14 days from the date above.", {
        align: "center",
      });
    doc.moveDown();
    doc.text("Please contact us to approve this quote and begin repair work.", {
      align: "center",
    });
  } else {
    doc
      .font("Helvetica-Oblique")
      .fontSize(10)
      .text("Thank you for your business!", { align: "center" });
  }

  doc.end();
}
