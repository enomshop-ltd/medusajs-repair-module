export interface TemplatePayload {
  html: string;
  text: string;
}

export function getRepairTemplate(
  templateName: string,
  data: any,
): TemplatePayload {
  try {
    switch (templateName) {
      case "repair-status":
        return getRepairStatusTemplate(data);
      case "repair-compliance":
        return getRepairComplianceTemplate(data);
      case "repair-reminder":
        return getRepairReminderTemplate(data);
      case "admin-repair-status":
        return getAdminRepairStatusTemplate(data);
      default:
        console.warn(
          `[Template-Debug] ⚠️ Repair template '${templateName}' not found.`,
        );
        return {
          html: `<p>Repair notification update.</p>`,
          text: `Repair notification update.`,
        };
    }
  } catch (error) {
    console.error(
      `[Template-Debug] ❌ Error generating repair template '${templateName}'`,
      error,
    );
    throw error;
  }
}

function getRepairStatusTemplate(data: any) {
  const { ticket_number, status, device, total_estimate, approval_url } = data;
  const customerName = data.customer?.first_name || "Valued Customer";
  
  let text = `Dear ${customerName},\n\nYour repair ticket #${ticket_number} for your ${device || "device"} is now: ${status.replace("_", " ")}.`;
  let html = `<div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-w-lg: 600px; margin: 0 auto;">
    <h2 style="color: #2563eb;">Repair Status Update</h2>
    <p>Dear ${customerName},</p>
    <p>The status of your repair ticket <strong>#${ticket_number}</strong> for your <strong>${device || "device"}</strong> has been updated to: <strong style="text-transform: capitalize;">${status.replace("_", " ")}</strong>.</p>`;

  if (total_estimate && Number(total_estimate) > 0) {
    const formattedEstimate = new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(Number(total_estimate));
    text += `\nEstimated total cost: ${formattedEstimate}.`;
    html += `<div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;">
      <p style="margin: 0; font-size: 16px;"><strong>Estimated Total Cost:</strong> ${formattedEstimate}</p>
    </div>`;
  }

  if (approval_url && status === "awaiting_approval") {
    text += `\n\nKindly approve the repair costs here to allow us to proceed: ${approval_url}`;
    html += `<p>Kindly review and approve the repair costs so we can proceed with the repair:</p>
      <p style="margin-top: 25px;"><a href="${approval_url}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Approve Repair</a></p>`;
  } else if (approval_url) {
    text += `\n\nYou can track your repair progress here: ${approval_url}`;
    html += `<p style="margin-top: 25px;"><a href="${approval_url}" style="color: #2563eb; text-decoration: underline; font-weight: 500;">Track your repair progress here</a>.</p>`;
  }

  text += `\n\nThank you for choosing us.\n\nBest Regards,\nThe Repair Team`;
  html += `<p style="margin-top: 30px;">Thank you for choosing us.</p>
    <p>Best Regards,<br/><strong>The Repair Team</strong></p>
  </div>`;

  return { html, text };
}

function getRepairComplianceTemplate(data: any) {
  const { ticket_number, device, compliance_url } = data;
  const customerName = data.customer?.first_name || "Valued Customer";
  
  const text = `Dear ${customerName},\n\nAction Required for your Repair Ticket #${ticket_number}.\n\nKindly accept our Repair Terms & Conditions and/or Data Wipe Consent before we can proceed with your device repair (${device}).\n\nPlease review and accept the terms using this secure link: ${compliance_url}\n\nThank you for your prompt action.\n\nBest Regards,\nThe Repair Team`;

  const html = `<div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-w-lg: 600px; margin: 0 auto;">
    <h2 style="color: #d97706;">Action Required: Repair Ticket #${ticket_number}</h2>
    <p>Dear ${customerName},</p>
    <p>We require your consent to our Repair Terms & Conditions before we can proceed with diagnosing or repairing your <strong>${device}</strong>.</p>
    <p>Kindly review and accept the terms by clicking the secure link below:</p>
    <p style="margin-top: 25px;"><a href="${compliance_url}" style="background-color: #d97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Review & Accept Terms</a></p>
    <p style="margin-top: 30px;">Thank you for your prompt action.</p>
    <p>Best Regards,<br/><strong>The Repair Team</strong></p>
  </div>`;

  return { html, text };
}

function getRepairReminderTemplate(data: any) {
  const { ticket_number, status, device, nudge_message, approval_url } = data;
  const customerName = data.customer?.first_name || "Valued Customer";

  const text = `Dear ${customerName},\n\nReminder for your Repair Ticket #${ticket_number} (${device}): ${nudge_message}\n\nCurrent Status: ${status.replace("_", " ")}\nTrack or take action here: ${approval_url}\n\nThank you,\n\nThe Repair Team`;

  const html = `<div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-w-lg: 600px; margin: 0 auto;">
    <h2 style="color: #2563eb;">Repair Reminder: Ticket #${ticket_number}</h2>
    <p>Dear ${customerName},</p>
    <p>${nudge_message}</p>
    <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #64748b; margin: 20px 0;">
      <p style="margin: 0;"><strong>Device:</strong> ${device}</p>
      <p style="margin: 8px 0 0 0;"><strong>Status:</strong> <span style="text-transform: capitalize;">${status.replace("_", " ")}</span></p>
    </div>
    <p style="margin-top: 25px;"><a href="${approval_url}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">View Ticket</a></p>
    <p style="margin-top: 30px;">Thank you.</p>
    <p>Best Regards,<br/><strong>The Repair Team</strong></p>
  </div>`;

  return { html, text };
}

function getAdminRepairStatusTemplate(data: any) {
  const { ticket_number, status, customer_name, device } = data;
  const text = `[ADMIN ALERT] Repair Ticket #${ticket_number}\nCustomer: ${customer_name}\nDevice: ${device}\nNew Status: ${status.replace("_", " ")}`;
  const html = `<div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
    <h3 style="color: #dc2626; margin-bottom: 15px;">[ADMIN ALERT] Repair Status Changed</h3>
    <div style="background-color: #fef2f2; padding: 15px; border-radius: 6px; border: 1px solid #fecaca;">
      <ul style="list-style-type: none; padding: 0; margin: 0;">
        <li style="margin-bottom: 8px;"><strong>Ticket #:</strong> ${ticket_number}</li>
        <li style="margin-bottom: 8px;"><strong>Customer:</strong> ${customer_name}</li>
        <li style="margin-bottom: 8px;"><strong>Device:</strong> ${device}</li>
        <li><strong>New Status:</strong> <span style="text-transform: capitalize; color: #dc2626; font-weight: bold;">${status.replace("_", " ")}</span></li>
      </ul>
    </div>
  </div>`;

  return { html, text };
}
