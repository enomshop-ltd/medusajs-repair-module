import { useState, useEffect } from "preact/hooks";
import { Info, Wrench } from "lucide-preact";

export default function TrackRepairIsland({
  initialToken,
  initialTicket,
  isLoggedIn = false,
}: {
  initialToken?: string;
  initialTicket?: string;
  isLoggedIn?: boolean;
}) {
  const [ticketNumber, setTicketNumber] = useState(initialTicket || "");
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialToken) {
      handleTokenSearch(initialToken);
    } else if (initialTicket) {
      handleSearch({ preventDefault: () => {} } as any);
    }
  }, [initialToken, initialTicket]);

  const handleTokenSearch = async (token: string) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/repairs/token/${token}`);
      if (!response.ok) throw new Error("Invalid or expired token");
      const data = await response.json();
      setTicket(data.repair_ticket);
    } catch (err: any) {
      setError(err.message || "Failed to find repair ticket");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: Event) => {
    e.preventDefault();
    if (!ticketNumber.trim()) return;

    setLoading(true);
    setError("");
    setTicket(null);

    try {
      const response = await fetch(`/api/repairs/${encodeURIComponent(ticketNumber)}`);

      if (!response.ok) throw new Error("Repair ticket not found");

      const data = await response.json();
      setTicket(data.repair_ticket);
    } catch (err: any) {
      setError(err.message || "Failed to find repair ticket");
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<
      string,
      { label: string; color: string; progress: number }
    > = {
      received: { label: "Received", color: "bg-gray-500", progress: 20 },
      diagnosing: { label: "Diagnosing", color: "bg-blue-500", progress: 40 },
      awaiting_approval: {
        label: "Awaiting Your Approval",
        color: "bg-orange-500",
        progress: 60,
      },
      repairing: {
        label: "Being Repaired",
        color: "bg-blue-600",
        progress: 80,
      },
      ready: {
        label: "Ready for Pickup",
        color: "bg-green-500",
        progress: 100,
      },
      completed: { label: "Completed", color: "bg-green-600", progress: 100 },
      cancelled: { label: "Cancelled", color: "bg-red-500", progress: 0 },
    };
    return (
      statusMap[status] || { label: status, color: "bg-gray-500", progress: 0 }
    );
  };

  const getStatusDescription = (status: string) => {
    const descMap: Record<string, string> = {
      received: "Your product has been successfully delivered to our service center. We will begin diagnosis shortly.",
      diagnosing: "Your product has been successfully delivered to our service center and is currently undergoing diagnosis. Our team is diligently working to identify the issue and determine the necessary repairs or service required.",
      awaiting_approval: "Diagnosis is complete. We have sent you a repair estimate and are awaiting your approval to proceed.",
      repairing: "Our technicians are currently working on your product. We are conducting the necessary repairs and service.",
      ready: "Your product has been successfully repaired and tested. It is now ready for pickup or delivery.",
      completed: "Your repair is complete and the product has been returned to you.",
      cancelled: "This repair ticket has been cancelled."
    };
    return descMap[status] || "Your product is currently being processed.";
  };

  return (
    <div class="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-6 text-slate-800">
          <Wrench size={32} />
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 mb-3">Track Your Repair</h1>
        <p className="text-slate-500 text-lg max-w-md mx-auto">
          Enter your repair ticket number to check the real-time status of your service.
        </p>
      </div>

      <form onSubmit={handleSearch} className="mb-12 max-w-xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={ticketNumber}
            onInput={(e) =>
              setTicketNumber((e.target as HTMLInputElement).value)
            }
            placeholder="Repair ID (e.g. REPAIR-1234)"
            className="flex-1 px-5 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base shadow-sm font-medium transition-all"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition disabled:bg-slate-400 disabled:cursor-not-allowed shadow-sm text-base font-semibold"
          >
            {loading ? "Searching..." : "Track Repair"}
          </button>
        </div>
        {error && (
          <p className="text-red-600 mt-3 text-center bg-red-50 p-2 rounded-lg text-sm">{error}</p>
        )}
      </form>

      {ticket && (
        <div className="space-y-12 max-w-5xl mx-auto">
          {/* Status Overview & Progress */}
          <div className="py-8 sm:py-12">
            <h2 className="text-3xl sm:text-4xl font-medium text-slate-900 text-center mb-6">
              Repair Status #{ticket.ticket_number}
            </h2>
            
            {ticket.terms_accepted && (
              <>
                <p className="text-slate-600 text-center max-w-3xl mx-auto mb-8 leading-relaxed text-lg">
              {getStatusDescription(ticket.status)}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xl text-slate-800 mb-16 relative">
              Estimated time of delivery:{" "}
              <span className="font-medium">
                {ticket.estimated_completion 
                  ? new Date(ticket.estimated_completion).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) 
                  : 'To be determined'}
              </span>
              <div className="group relative flex items-center cursor-help mt-1 sm:mt-0">
                <Info size={20} className="text-blue-500" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 p-3 bg-slate-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl text-center">
                  Please note that these are not guarantee estimates, delivery date is subject to change based on the repair progress.
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
                </div>
              </div>
            </div>

            <div className="relative flex justify-between w-full mb-8 overflow-x-auto pb-4 sm:pb-0">
              <div className="min-w-[600px] w-full relative">
                <div className="absolute top-[29px] left-[calc(100%/12)] right-[calc(100%/12)] h-[2px] bg-slate-200 z-0"></div>
                <div 
                  className="absolute top-[29px] left-[calc(100%/12)] h-[2px] bg-blue-500 z-0 transition-all duration-700"
                  style={{ 
                    width: `calc(${Math.max(0, ['received', 'diagnosing', 'awaiting_approval', 'repairing', 'ready', 'completed'].indexOf(ticket.status)) / 5} * (100% - (100%/6)))` 
                  }}
                ></div>

                <div className="flex justify-between w-full">
                  {[
                    { status: 'received', title: 'Pickup', desc: 'Product was picked up from you.' },
                    { status: 'diagnosing', title: 'Diagnosis', desc: 'We are diagnosing your product.' },
                    { status: 'awaiting_approval', title: 'Approval', desc: 'Awaiting your approval.' },
                    { status: 'repairing', title: 'Repair', desc: 'Repair is in progress.' },
                    { status: 'ready', title: 'Testing', desc: 'Testing your product.' },
                    { status: 'completed', title: 'Delivery', desc: 'Product is delivered.' },
                  ].map((step, idx) => {
                    const currentStatusIndex = ['received', 'diagnosing', 'awaiting_approval', 'repairing', 'ready', 'completed'].indexOf(ticket.status);
                    const isPast = idx <= currentStatusIndex;
                    const isCurrent = idx === currentStatusIndex;
                    let dateStr = "-";
                    if (idx === 0 && ticket.created_at) dateStr = new Date(ticket.created_at).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' });
                    if (idx === 2 && ticket.approved_at) dateStr = new Date(ticket.approved_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                    if (isCurrent && ticket.updated_at && idx !== 0 && idx !== 2) dateStr = new Date(ticket.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

                    return (
                      <div key={step.status} className="flex flex-col items-center z-10 flex-1">
                        <div className={`text-xs mb-3 h-4 font-medium ${isPast ? 'text-slate-500' : 'text-slate-400'}`}>{dateStr}</div>
                        <div className={`w-3 h-3 rounded-full mb-4 ring-4 ring-white ${isPast ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                        <div className={`font-medium text-sm mb-1 ${isPast ? 'text-slate-900' : 'text-slate-400'}`}>{step.title}</div>
                        <div className="text-xs text-slate-500 text-center px-1 max-w-[120px]">{step.desc}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
              </>
            )}
            
            {isLoggedIn && (
              <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-1">Device</h3>
                  <p className="text-lg font-medium text-slate-900">{ticket.device?.brand} {ticket.device?.model_name}</p>
                  <p className="text-sm text-slate-500">Serial: {ticket.device?.serial_number}</p>
                </div>
                {ticket.warranty_expiry && (
                  <div className="text-left sm:text-right">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-1">Warranty Coverage Until</h3>
                    <p className="text-lg font-medium text-slate-900">{new Date(ticket.warranty_expiry).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            )}
            {isLoggedIn && ticket.issue_description && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-2">Reported Issue</h3>
                <p className="text-slate-800 leading-relaxed">{ticket.issue_description}</p>
                {ticket.accessories && (
                  <p className="text-sm text-slate-500 mt-3 bg-slate-50 p-3 rounded-lg inline-block border border-slate-100">
                    <span className="font-medium text-slate-700">Included Accessories:</span> {ticket.accessories}
                  </p>
                )}
              </div>
            )}

            {!ticket.terms_accepted && (
              <div className="mt-12 p-8 bg-yellow-50 border border-yellow-200 rounded-xl shadow-sm max-w-2xl mx-auto">
                <h4 className="text-yellow-800 font-bold mb-4 text-xl">
                  Action Required: Legal & Compliance
                </h4>
                <p className="text-yellow-800 mb-6 text-lg">
                  Before we can proceed with any work, you must review and
                  agree to our Repair Terms & Conditions.
                </p>

                <div className="flex flex-col gap-4 mb-8">
                  <label className="flex items-start gap-3 text-gray-800 cursor-pointer">
                    <input
                      type="checkbox"
                      id="termsCheck"
                      className="mt-1 rounded border-gray-300 w-5 h-5 accent-yellow-600"
                    />
                    <span className="text-base font-medium">
                      I agree to the <a href="/legal/terms" target="_blank" className="underline hover:text-yellow-900">Repair Terms & Conditions</a>
                    </span>
                  </label>
                  <label className="flex items-start gap-3 text-gray-800 cursor-pointer">
                    <input
                      type="checkbox"
                      id="dataCheck"
                      className="mt-1 rounded border-gray-300 w-5 h-5 accent-yellow-600"
                    />
                    <span className="text-base font-medium">
                      I consent to a device data wipe (if necessary for the repair)
                    </span>
                  </label>
                </div>

                <button
                  onClick={async () => {
                    const terms = (document.getElementById("termsCheck") as HTMLInputElement).checked;
                    const dataWipe = (document.getElementById("dataCheck") as HTMLInputElement).checked;

                    if (!terms) {
                      alert("Please agree to the Repair Terms to continue.");
                      return;
                    }

                    try {
                      const targetUrl = initialToken ? `/api/repairs/compliance` : `/api/repairs/${ticket.id}/compliance`;
                      const bodyData = initialToken 
                        ? { token: initialToken, terms_accepted: true, data_wiped_consent: dataWipe }
                        : { terms_accepted: true, data_wiped_consent: dataWipe };

                      const response = await fetch(targetUrl, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(bodyData),
                      });

                      if (response.ok) {
                        alert("Terms accepted successfully!");
                        if (initialToken) handleTokenSearch(initialToken);
                        else handleSearch(new Event("submit") as any);
                      } else {
                        throw new Error("Failed to accept terms");
                      }
                    } catch (err: any) {
                      alert(err.message || "Failed to update compliance details");
                    }
                  }}
                  className="w-full px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition font-semibold text-lg shadow-sm"
                >
                  Accept & Continue
                </button>
              </div>
            )}

          </div>

          

          
          {/* Side-by-Side: Cost Breakdown and Messages */}
          {isLoggedIn && ticket.terms_accepted && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-8 pb-4">
              {/* Cost Breakdown Column */}
              {(ticket.total_estimate > 0 || ticket.total_actual > 0) ? (
                <div className="flex-1">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-6">
                <h3 className="text-xl font-medium text-slate-900">Cost Breakdown</h3>
                <div className="flex gap-2">
                  <a
                    href={initialToken ? `/api/repairs/token/${initialToken}/document?type=quote` : `/api/repairs/${ticket.id}/document?type=quote`}
                    target="_blank"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    Quote PDF
                  </a>
                  {(ticket.status === "completed" || ticket.status === "ready") && (
                    <a
                      href={initialToken ? `/api/repairs/token/${initialToken}/document?type=invoice` : `/api/repairs/${ticket.id}/document?type=invoice`}
                      target="_blank"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                      Invoice PDF
                    </a>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  {ticket.parts && ticket.parts.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Inventory Parts</h4>
                      <div className="space-y-2">
                        {ticket.parts.map((p: any) => (
                          <div key={p.id} className="flex justify-between items-start text-sm pb-2 border-b border-slate-100 last:border-0">
                            <div>
                              <span className="text-slate-800">{p.title} {p.product?.title ? `(${p.product.title})` : ""}</span>
                              <div className="text-slate-400 text-xs mt-0.5">SKU: {p.sku || "-"}</div>
                            </div>
                            {p.product?.handle && (
                              <a href={`/products/${p.product.handle}`} target="_blank" className="text-blue-600 hover:text-blue-800 text-xs font-medium whitespace-nowrap ml-4">
                                View in store &rarr;
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {ticket.custom_parts && ticket.custom_parts.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Custom Parts / Services</h4>
                      <div className="space-y-2">
                        {ticket.custom_parts.map((cp: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-sm pb-2 border-b border-slate-100 last:border-0">
                            <span className="text-slate-800">{cp.name}</span>
                            <span className="font-medium text-slate-900">${(cp.price / 100).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="bg-slate-50/50 rounded-lg p-5 border border-slate-100">
                    <div className="space-y-2.5 text-sm">
                      <div className="flex justify-between text-slate-600">
                        <span>Parts Estimate</span>
                        <span className="font-medium text-slate-900">${((ticket.parts_estimate || 0) / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Labor Estimate</span>
                        <span className="font-medium text-slate-900">${((ticket.labor_estimate || 0) / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-base font-medium text-slate-900 border-t border-slate-200 pt-2.5 mt-2.5">
                        <span>Total Estimate</span>
                        <span>${((ticket.total_estimate || 0) / 100).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              

              {ticket.status === "awaiting_approval" &&
                !ticket.is_approved &&
                ticket.terms_accepted && (
                  <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded">
                    <p className="text-orange-800 font-medium mb-3">
                      Your approval is required to proceed with the repair.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          try {
                            const targetUrl = initialToken ? `/api/repairs/approve` : `/api/repairs/${ticket.id}/approve`;
                            const bodyData = initialToken ? { token: initialToken, approved: true } : { approved: true };

                            const response = await fetch(targetUrl, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify(bodyData),
                            });

                            if (response.ok) {
                              alert("Repair approved! Work will begin shortly.");
                              if (initialToken) handleTokenSearch(initialToken);
                              else handleSearch(new Event("submit") as any);
                            } else {
                              throw new Error("Failed to approve repair");
                            }
                          } catch (err) {
                            alert("Failed to approve repair");
                          }
                        }}
                        className="flex-1 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                      >
                        Approve Repair
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm("Are you sure you want to decline this repair? This will cancel the ticket.")) return;
                          try {
                            const targetUrl = initialToken ? `/api/repairs/approve` : `/api/repairs/${ticket.id}/approve`;
                            const bodyData = initialToken ? { token: initialToken, approved: false } : { approved: false };

                            const response = await fetch(targetUrl, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify(bodyData),
                            });

                            if (response.ok) {
                              alert("Repair has been declined and cancelled.");
                              if (initialToken) handleTokenSearch(initialToken);
                              else handleSearch(new Event("submit") as any);
                            } else {
                              throw new Error("Failed to decline repair");
                            }
                          } catch (err) {
                            alert("Failed to decline repair");
                          }
                        }}
                        className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                      >
                        Decline Repair
                      </button>
                    </div>
                  </div>
                )}

              {ticket.is_approved && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-green-800 text-sm">
                    Approved on{" "}
                    {new Date(ticket.approved_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
              ) : (
                <div className="flex-1 text-slate-500 italic text-sm">No cost estimate available yet.</div>
              )}

              {/* Chat Messages Column */}
              <div className="flex-1">
              <h3 className="text-xl font-medium text-slate-900 mb-6 border-b border-slate-200 pb-2">Messages</h3>

              {(ticket.messages || ticket.updates) && (ticket.messages || ticket.updates).length > 0 ? (
                <div className="space-y-6 max-h-[400px] overflow-y-auto mb-6 pr-2">
                  {(ticket.messages || ticket.updates).map((update: any) => {
                    const isCustomer = update.author_type === 'customer';
                      return (
                        <div key={update.id} className={`flex flex-col ${isCustomer ? 'items-end' : 'items-start'}`}>
                          <div className={`flex items-baseline gap-2 mb-1 ${isCustomer ? 'flex-row-reverse' : 'flex-row'}`}>
                            <span className={`font-semibold text-sm ${isCustomer ? 'text-slate-900' : 'text-blue-600'}`}>
                              {isCustomer ? "You" : "Technician"}
                            </span>
                            <span className="text-xs text-slate-400">
                              {new Date(update.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                            </span>
                          </div>
                          <p className={`text-sm leading-relaxed whitespace-pre-wrap py-2 px-3 rounded-2xl max-w-[90%] ${isCustomer ? 'bg-slate-100 text-slate-800 rounded-br-sm' : 'bg-transparent text-slate-800 border-l-2 border-blue-200 rounded-none pl-3 py-1'}`}>
                            {update.message || update.content}
                          </p>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-slate-500 mb-6 italic text-sm">No messages yet. Feel free to ask a question.</p>
              )}

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const input = form.elements.namedItem("message") as HTMLInputElement;
                  const message = input.value.trim();

                  if (!message) return;

                  try {
                    const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
                    submitBtn.disabled = true;
                    submitBtn.textContent = "Sending...";

                    const bodyData: any = { message };
                    if (initialToken) {
                      bodyData.token = initialToken;
                    }

                    const response = await fetch(`/api/repairs/${ticket.id}/messages`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(bodyData),
                    });

                    if (!response.ok) throw new Error("Failed to send message");

                    if (initialToken) {
                      handleTokenSearch(initialToken);
                    } else {
                      handleSearch(new Event("submit") as any);
                    }

                    form.reset();
                  } catch (err) {
                    alert("Failed to send message");
                    console.error(err);
                  } finally {
                    const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Send";
                  }
                }}
                className="flex gap-4 items-center pt-2"
              >
                <input
                  type="text"
                  name="message"
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent border-0 border-b border-slate-300 focus:ring-0 focus:border-blue-500 px-1 py-2 text-slate-800 placeholder-slate-400"
                  required
                />
                <button
                  type="submit"
                  className="text-blue-600 font-semibold hover:text-blue-800 disabled:text-slate-400 transition-colors uppercase text-sm tracking-wide"
                >
                  Send
                </button>
              </form>
            </div>
            </div>
          )}

          {/* RESTORED: Media Gallery */}
          {isLoggedIn && ticket.terms_accepted && ticket.media && ticket.media.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Device Photos</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {ticket.media.map((media: any) => (
                  <a
                    key={media.id}
                    href={media.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-square rounded overflow-hidden border hover:opacity-80"
                  >
                    <img
                      src={media.file_url}
                      alt="Device"
                      className="w-full h-full object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* RESTORED: Customer-visible Notes */}
          {isLoggedIn && ticket.terms_accepted && ticket.notes &&
            ticket.notes.filter((n: any) => !n.is_internal).length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Updates</h3>
                <div className="space-y-3">
                  {ticket.notes
                    .filter((note: any) => !note.is_internal)
                    .map((note: any) => (
                      <div key={note.id} className="p-4 bg-gray-50 rounded">
                        <p className="text-sm text-gray-500 mb-1">
                          {new Date(note.created_at).toLocaleString()}
                        </p>
                        <p>{note.content}</p>
                      </div>
                    ))}
                </div>
              </div>
            )}

          
        </div>
      )}
    </div>
  );
}
