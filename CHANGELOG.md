# Changelog

All notable changes to this project will be documented in this file.

## [v1.1.0] - 2026-05-06

### Added

- **Navigation:** Added a new "Repair" submenu under the "Dashboard" section in the admin panel.
- **Parts Management:** Implemented UI and functionality to add both inventory and custom parts (with specific names and prices) to repair tickets.
- **Admin Columns:** Added the customer's name (or email) in brackets next to the Ticket Number in the admin repair list.
- **Accessories UI:** Added a pill/bubble UI for adding accessories. Each item entered after a comma now converts into a separate bubble.
- **Notifications:** Enhanced the `repair-status-changed` subscriber to automatically fire all available notification channels (via the Notification module) upon ticket status updates.
- **Internal Admin Notifications:** Added an `admin` channel ping to display standard internal Medusa notifications in the admin feed right drawer.
- **Auto-Inventory Sync:** Marked completed tickets to intelligently auto-deduct required inventory levels for variants.
- **Tokenized Customer Approvals:** Introduced `approval_token` so end-users can safely view and approve "Awaiting Approval" repairs securely.

### Changed

- **Device UI:** Altered the "Device Condition" field on repair creation/editing into a Textarea for larger and more detailed descriptions.
- **Widget Location:** Moved the "Active Repair Tickets" widget from the `order.details.before` zone to the `customer.details.before` zone, providing better visibility at the customer profile level.

### Removed

- **Unused Fields:** Removed the "ETC" (Estimated Time of Completion) column from the repair admin pages to declutter the dashboard list.

## [v1.0.1] - 2026-05-\*\*

### Fixed

- Fixed browser serialization errors for `labor_estimate` and `parts_estimate` by safely mapping numeric values in the frontend.
- Hardened the `GET /admin/repairs/:id` endpoint to gracefully handle missing product variants.

## [v1.0.0] - 2026-04-\*\*

### Added

- Initial release of the Repair Management module.
- Introduced `Device`, `RepairTicket`, `RepairMedia`, `RepairNote`, and `RepairUpdate` data models.
- Integrated Fresh.js components for storefront visualization (`/store/repairs/track`).
- Created admin interfaces for checking in and managing repair workflows.
