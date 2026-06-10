import { MedusaResponse } from "@medusajs/framework/http";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

// Helpers
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateString: string | Date) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
};

export async function generateRepairDocument(
  docType: string,
  ticket: any,
  customerName: string,
  res: MedusaResponse,
) {
  const parseNum = (val: any) => {
    if (!val) return 0;
    if (typeof val === "object" && "value" in val) return Number(val.value) / 100;
    return Number(val) / 100;
  };

  const tTotal = parseNum(ticket.total_estimate);
  const tActual = parseNum(ticket.total_actual);
  const finalTotal = ticket.status === "completed" && tActual > 0 ? tActual : tTotal;

  // Generate QR code
  const qrUrl = `${process.env.STORE_URL || "http://localhost:3000"}/store/repairs/track?number=${ticket.ticket_number}`;
  let qrBuffer: Buffer | null = null;
  try {
    qrBuffer = await QRCode.toBuffer(qrUrl, {
      errorCorrectionLevel: "H",
      type: "png",
      margin: 1,
      width: 60,
    });
  } catch (e) {}

  const doc = new PDFDocument({ margin: 50, size: "A4" });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${ticket.ticket_number}-${docType}.pdf"`,
  );

  doc.pipe(res);

  // 1. Logo (Text placeholder since no image is provided)
  doc.fontSize(28).font("Helvetica-Bold").fillColor("#333").text("URBAN", 50, 50, { continued: true }).fillColor("#666").text(" DEVICE CARE");
  doc.fontSize(10).fillColor("#999").text("SINCE 2025", 50, 80);

  // 2. Document Title & Number
  let title = "INVOICE";
  let prefix = "INV";
  if (docType === "job_card") { title = "JOB CARD"; prefix = "JOB"; }
  else if (docType === "receipt") { title = "RECEIPT"; prefix = "REC"; }
  else if (docType === "quote") { title = "QUOTATION"; prefix = "QUO"; }

  doc.fontSize(26).font("Helvetica").fillColor("#000").text(title, 350, 50, { align: "right" });
  
  // Clean ticket number for prefix (e.g. REPAIR-1234 -> 1234)
  const numericTicket = ticket.ticket_number ? ticket.ticket_number.replace(/\D/g, "").padStart(6, "0") : "000000";
  const docNumber = `# ${prefix}${numericTicket}`;
  doc.fontSize(10).font("Helvetica-Bold").text(docNumber, 350, 80, { align: "right" });

  // 3. Balance Due
  let balanceDue = 0;
  let paymentMade = 0;
  if (docType === "invoice") {
     paymentMade = parseNum(ticket.deposit) || 0;
     balanceDue = finalTotal - paymentMade;
  } else if (docType === "receipt") {
     paymentMade = finalTotal;
     balanceDue = 0;
  }

  if (docType === "invoice" || docType === "receipt") {
      doc.fontSize(10).font("Helvetica").text("Balance Due", 350, 110, { align: "right" });
      doc.fontSize(12).font("Helvetica-Bold").text(`KES${formatCurrency(balanceDue)}`, 350, 125, { align: "right" });
  }

  // Company Info
  doc.fontSize(10).font("Helvetica-Bold").fillColor("#000").text("Urban Device Care Ltd", 50, 130);
  doc.font("Helvetica").fontSize(9).fillColor("#333");
  doc.text("Bekim house", 50, 145);
  doc.text("Westlands crossway Road");
  doc.text("Nairobi 00800");
  doc.text("Kenya");
  doc.text("0115682959");
  doc.text("7c8bczm6zk@privaterelay.appleid.com");
  doc.text("KRA PIN P052534849N");

  // QR Code positioned near company info
  if (qrBuffer) {
      doc.image(qrBuffer, 50, 230, { width: 60 });
  }

  // Dates and Meta
  const metaY = 250;
  const addMetaRow = (label: string, value: string, yPos: number) => {
      doc.font("Helvetica").fillColor("#333").text(label, 300, yPos, { width: 100, align: "right" });
      doc.text(value, 420, yPos, { width: 120, align: "right" });
  };

  let rowY = metaY;
  if (docType === "quote") {
      addMetaRow("Quote Date :", formatDate(ticket.created_at || new Date()), rowY); rowY += 15;
      const validUntil = new Date(ticket.created_at || new Date());
      validUntil.setDate(validUntil.getDate() + 14);
      addMetaRow("Valid Until :", formatDate(validUntil), rowY); rowY += 15;
  } else if (docType === "job_card") {
      addMetaRow("Intake Date :", formatDate(ticket.created_at || new Date()), rowY); rowY += 15;
      addMetaRow("Status :", String(ticket.status || "Unknown").toUpperCase(), rowY); rowY += 15;
  } else if (docType === "receipt") {
      addMetaRow("Payment Date :", formatDate(new Date()), rowY); rowY += 15;
  } else {
      addMetaRow("Invoice Date :", formatDate(ticket.created_at || new Date()), rowY); rowY += 15;
      addMetaRow("Terms :", "Due on Receipt", rowY); rowY += 15;
      addMetaRow("Due Date :", formatDate(ticket.created_at || new Date()), rowY); rowY += 15;
  }

  // Bill To / Customer Data
  doc.font("Helvetica-Bold").fontSize(10).fillColor("#000").text(customerName || "Customer", 50, metaY + 30);
  if (docType === "job_card") {
     doc.font("Helvetica").fontSize(9).fillColor("#333");
     doc.text(`Device: ${ticket.device?.brand || ""} ${ticket.device?.model_name || ""}`);
     doc.text(`S/N: ${ticket.device?.serial_number || "N/A"}`);
     doc.text(`Reported Issue: ${ticket.issue_description || "No description provided."}`);
  }

  // Table
  const tableTop = 320;
  doc.rect(50, tableTop, 495, 20).fill("#444444");
  
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(9);
  doc.text("#", 60, tableTop + 6);
  doc.text("Description", 90, tableTop + 6);
  doc.text("Qty", 350, tableTop + 6, { width: 30, align: "center" });
  doc.text("Rate", 390, tableTop + 6, { width: 60, align: "right" });
  doc.text("Amount", 460, tableTop + 6, { width: 75, align: "right" });

  let currentY = tableTop + 30;
  doc.fillColor("#333333").font("Helvetica").fontSize(9);

  let i = 1;
  const drawRow = (desc: string, qty: number, rate: number, amt: number) => {
      // Ensure we don't bleed off the page, if we do we'd normally add a new page
      // but for repair tickets 1 page is usually enough
      if (currentY > 700) {
          doc.addPage();
          currentY = 50;
      }
      
      doc.text(i.toString(), 60, currentY);
      doc.text(desc, 90, currentY, { width: 250 });
      doc.text(qty.toFixed(2), 350, currentY, { width: 30, align: "center" });
      doc.text(formatCurrency(rate), 390, currentY, { width: 60, align: "right" });
      doc.text(formatCurrency(amt), 460, currentY, { width: 75, align: "right" });
      
      const height = doc.heightOfString(desc, { width: 250 }) || 10;
      currentY += height + 10;
      
      doc.moveTo(50, currentY - 5).lineTo(545, currentY - 5).lineWidth(0.5).strokeColor("#EEEEEE").stroke();
      
      i++;
  };

  if (ticket.parts && Array.isArray(ticket.parts)) {
      for (const p of ticket.parts) {
          const price = parseNum(p.prices?.[0]?.amount);
          drawRow(`${p.title} (SKU: ${p.sku || "N/A"})`, 1, price, price);
      }
  }

  if (ticket.custom_parts && Array.isArray(ticket.custom_parts)) {
      for (const cp of ticket.custom_parts) {
          const price = parseNum(cp.price);
          drawRow(cp.name, 1, price, price);
      }
  }

  const labor = parseNum(ticket.labor_estimate);
  if (labor > 0) {
      drawRow("Labor & Service Fee", 1, labor, labor);
  }

  if (i === 1) {
      doc.text("No cost items added yet.", 90, currentY);
      currentY += 20;
      doc.moveTo(50, currentY - 5).lineTo(545, currentY - 5).lineWidth(0.5).strokeColor("#EEEEEE").stroke();
  }

  currentY += 10;
  const summaryX = 350;

  const addSummaryRow = (label: string, value: string, yPos: number, isBold: boolean = false, valColor: string = "#333", bg: boolean = false) => {
      if (bg) {
          doc.rect(250, yPos - 5, 295, 20).fill("#F4F4F4");
      }
      doc.font(isBold ? "Helvetica-Bold" : "Helvetica").fillColor("#333").fontSize(9);
      doc.text(label, summaryX, yPos, { width: 80, align: "right" });
      doc.fillColor(valColor).font(isBold ? "Helvetica-Bold" : "Helvetica").text(value, summaryX + 90, yPos, { width: 95, align: "right" });
  };

  if (docType !== "job_card") {
      addSummaryRow("Sub Total", formatCurrency(finalTotal), currentY); currentY += 20;
      doc.moveTo(300, currentY - 10).lineTo(545, currentY - 10).lineWidth(0.5).strokeColor("#DDDDDD").stroke();

      addSummaryRow("Total", `KES${formatCurrency(finalTotal)}`, currentY, true); currentY += 20;

      if (docType === "invoice" || docType === "receipt") {
          addSummaryRow("Payment Made", `(-) ${formatCurrency(paymentMade)}`, currentY, false, "#C00000"); currentY += 20;
          addSummaryRow("Balance Due", `KES${formatCurrency(balanceDue)}`, currentY, true, "#000", true); currentY += 20;
      }
  }

  // Signatures for job card
  if (docType === "job_card") {
      currentY += 50;
      if (currentY > 700) { doc.addPage(); currentY = 50; }
      
      doc.moveTo(50, currentY).lineTo(250, currentY).strokeColor("#000000").stroke();
      doc.fontSize(10).font("Helvetica").text("Technician Signature", 50, currentY + 5);
      
      doc.moveTo(350, currentY).lineTo(545, currentY).stroke();
      doc.text("Customer Signature", 350, currentY + 5);
  }

  const pageHeight = doc.page.height;
  doc.fontSize(9).font("Helvetica").fillColor("#333");
  doc.text("Thanks for your business.", 50, pageHeight - 120);
  doc.text("Paybill: 880100 - Acc No: PAYURBANDEVICE", 50, pageHeight - 105);

  doc.moveTo(50, pageHeight - 50).lineTo(545, pageHeight - 50).lineWidth(0.5).strokeColor("#CCCCCC").stroke();
  doc.fontSize(8).fillColor("#999").text("POWERED BY URBAN DEVICE CARE", 50, pageHeight - 40);
  // page numbers (pdfkit automatically adds pages, but since it's typically 1 page, hardcoding 1 is ok)
  doc.text("1", 530, pageHeight - 40, { align: "right" });

  doc.end();
}
