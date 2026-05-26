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
  let text = `Your repair ticket ${ticket_number} for ${device} is now: ${status}.`;
  let html = `<p>Your repair ticket <strong>${ticket_number}</strong> for ${device || "your device"} is now: <strong>${status}</strong>.</p>`;

  if (total_estimate && Number(total_estimate) > 0) {
    text += ` Estimated total: $${total_estimate}.`;
    html += `<p>Estimated total: $${total_estimate}</p>`;
  }

  if (approval_url && status === "awaiting_approval") {
    text += ` Please approve the repair here: ${approval_url}`;
    html += `<p>Please <a href="${approval_url}">approve your repair here</a>.</p>`;
  } else if (approval_url) {
    text += ` Track your repair here: ${approval_url}`;
    html += `<p><a href="${approval_url}">Track your repair here</a>.</p>`;
  }

  return { html, text };
}

function getRepairComplianceTemplate(data: any) {
  const { ticket_number, device, compliance_url } = data;
  const text = `Action Required for your Repair Ticket #${ticket_number}.\n\nWe need you to accept our Repair Terms & Conditions and/or Data Wipe Consent before we can proceed with your device repair (${device}).\n\nPlease review and accept the terms using this unique link: ${compliance_url}`;

  const html = `
    <h2>Action Required: Repair Ticket #${ticket_number}</h2>
    <p>We need you to accept our Repair Terms & Conditions before we can proceed with your device repair (${device}).</p>
    <p><a href="${compliance_url}" style="background-color: #d97706; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block;">Review & Accept Terms</a></p>
  `;

  return { html, text };
}

function getRepairReminderTemplate(data: any) {
  const { ticket_number, status, device, nudge_message, approval_url } = data;
  const text = `Reminder for your Repair Ticket #${ticket_number} (${device}): ${nudge_message}\n\nCurrent Status: ${status}\nTrack or take action here: ${approval_url}`;

  const html = `
    <h2>Repair Reminder: Ticket #${ticket_number}</h2>
    <p>${nudge_message}</p>
    <p>Device: ${device}<br>Status: ${status}</p>
    <p><a href="${approval_url}" style="background-color: #2563eb; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block;">View Ticket</a></p>
  `;

  return { html, text };
}

function getAdminRepairStatusTemplate(data: any) {
  const { ticket_number, status, customer_name, device } = data;
  const text = `[ADMIN] Repair Ticket ${ticket_number} (Customer: ${customer_name}, Device: ${device}) has changed status to: ${status}.`;
  const html = `<p><strong>[ADMIN ALERT]</strong></p>
    <p>Repair Ticket: ${ticket_number}</p>
    <p>Customer: ${customer_name}</p>
    <p>Device: ${device}</p>
    <p>New Status: <strong>${status}</strong></p>`;

  return { html, text };
}
