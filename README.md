# Medusa Repair Module

A complete Repair Management System for Medusa, ideal for device repair shops. Features include customer tracking, parts management, real-time chat, cost approval flows, warranty tracking, and in-depth reporting.

## Key Features  

- **Device & Ticket Management:** Track devices by standard serial numbers or IMEI. Manage repair life-cycles across multiple statuses (`received`, `diagnosing`, `awaiting_approval`, `repairing`, `ready`, `completed`, `cancelled`).
- **Parts & Inventory:** Add both standard Medusa product variants (with inventory integration) and custom parts with ad-hoc pricing to any ticket. Completed tickets auto-deduct standard inventory.
- **Enhanced Admin UI:** Manage tickets directly from the dashboard, see active repairs directly on customer profiles, and add accessories via quick pill/bubble inputs. 
- **Customer Portal:** Storefront integration (Fresh.js-ready) so customers can track repairs using device details.
- **Approvals:** Secure token-based approval flow for end-users to review diagnostic costs or part approvals securely.
- **Notifications & Chat:** Built-in two-way messaging between technicians and customers. Status changes trigger full notification channels natively including standard admin feed alerts.
- **Reporting & Media:** Upload Defect photos or videos directly to repair tickets. Deep analytics provide insights into average repair times and revenue.

## Development & Usage

- Navigate to `/app/repairs` in your admin panel to check-in devices or edit ongoing repairs. 
- The module securely integrates with the primary Medusa modules (Authentication, Product, Inventory, Customer, and Notifications).

## Changelog

### v1.8.0 (Current)
- **Bug Fix**: Fixed tracking backend returning 500 logic errors when invalid relational mappings were queried, which caused false "Repair ticket not found" statuses on the storefront Tracking page.
- **Bug Fix**: Secured the `/store/customers/me/repairs` dashboard endpoint using Medusa's standard `authenticate` middleware to fix the "Go to login" generic connection failure.
- **Stability Improvement**: Bolstered `GraphQuery` error handling to gracefully degrade instead of crashing the endpoint, preventing confusing errors on the frontend.

### v1.7.0
 - Frontend Optimization & Stability
- **FreshJS Partials & View Transitions:** Overhauled the Storefront (`/repairs/*`) applications incorporating the `@fresh/runtime` `Partial` boundaries and `view-transition` meta tags for smooth, SPA-like navigation between dashboard, booking, and tracking pages.
- **CSP Nonces Architecture:** Integrated baseline for Content Security Policy nonces targeting script behaviors in the repair booking and tracking frontend views to secure them against basic XSS vectors.

### v1.6.0 - Universal PDF Invoice & Document Generation
- **Dynamic PDF Rendering:** Added robust PDF generation utilizing `pdfkit` and `qrcode` across both the Admin Dashboard and the Frontend Customer portals.
- **Support for Multiple Types:** Generates `Invoice`, `Quote`, `Receipt`, and `Job Card` layouts from a centralized internal template.
- **Download Actions:** Embedded one-click PDF downloading into the Admin detail view header and the Customer / Storefront tracking widgets.

### v1.5.0 - Omni-Channel Notifications & Client Dashboard
- **Omni-Channel Notify Subscriber:** Designed a centralized subscriber module (`globalNotificationHandler` in `notifications.ts`) that dispatches contextual Email, SMS, and WhatsApp alerts for tracking Repair Status updates, Compliance actions, and reminders.
- **My Repairs Dashboard (Storefront):** Added a `/repairs/dashboard` page where logged-in customers can review all their historical and active repairs natively in the web storefront.
- **Improved Logging:** Implemented extensive tracking for customer API routes (both booking and retrieval) marking distinct success pathways and debugging traces.

### v1.4.0 - Self-Service Booking & Compliance Tracking
- **Storefront Booking Form:** Customers can now initiate and book repairs directly from the storefront (`/repairs/book`) when logged in. Devices details, serial numbers, and issue descriptions are sent directly directly into the backend workflow.
- **Cost Estimate Display:** The storefront tracking widget now surfaces full estimate breakdowns alongside "Inventory Parts" and "Custom Parts/Services". Added an integrated deep-link for Store Inventory parts to let users view specific component details on the frontend.
- **Compliance Integration:** Standardized the Legal & Data Consent compliance directly into the book repair flow, tracking 'T&C Accepted' and 'Data Wipe' consents.

### v1.3.1 - Bug Fixes & Improvements
- **Currency Formatting:** Created `useStoreCurrency` custom React hook. This hook fetches the configured `default_currency_code` and `supported_currencies` directly from Medusa (`/admin/stores`) to ensure dynamic native currency formats (like KES) are utilized across analytics, widgets, and tickets, instead of hardcoded USD "$".
- **Icons Import Fix:** Fixed build error by changing out-of-date export `Bell` from `@medusajs/icons` to `BellAlert` in the repairs admin page.

### v1.3.0 - UI Simplification & Reminders
- **Unified Timeline:** Merged "Internal Notes" and "Customer Chat" widgets into a single clean timeline view, distinguishing entries by color and labels in both the Admin Dashboard and the Fresh.js Storefront.
- **Customer Reminders:** Replaced the "Print Job Card" and "Print Receipt" buttons with a single "Send Reminder" button.
- **Nudge Notifications:** The reminder button emits an event (`repair.customer_reminder`) that attempts to message the customer across Email, SMS, and WhatsApp with an action-specific nudge message based on ticket status.

### v1.2.0 - Inventory & Parts Enhancements
- Consolidated documentation into a single robust README file and removed the separate CHANGELOG.md file.
- **Parts Management:** Implemented the ability to remove added inventory parts from a repair ticket via the admin UI.
- **Inventory Stock Reservation:** Inventory is now automatically reserved (`createReservationItems`) when an inventory part is added to a repair. 
- **Stock Restoration:** When a part is removed from an active repair, its stock reservation is automatically released. Completed repairs permanently deduct from reserved stock and clear the temporary reservation.

### v1.1.0 - Usability Enhancements
- **Navigation:** Added a new "Repair" submenu under the Dashboard.
- **Parts Management:** Support for both inventory and custom parts.
- **Accessories UI:** Pill/bubble UI for comma-separated accessory fields.
- **Notifications:** Enhanced the `repair-status-changed` subscriber to trigger internal admin pings and customer updates.
- **Auto-Inventory Sync:** Intelligent inventory deduction on complete status.
- **Tokenized Customer Approvals:** Secure `approval_token` implementation for cost verification.

### v1.0.1 - Bug Fixes
- Addressed numeric serialization errors in estimating flows.
- Hardened variant absence handling in the `GET /admin/repairs/:id` endpoint.

### v1.0.0 - Initial Release
- Core data models and REST endpoints mapped.
- Introduction of Fresh.js integration for storefront tracking.
- Baseline Admin SDK widgets mapped for active repairs.
