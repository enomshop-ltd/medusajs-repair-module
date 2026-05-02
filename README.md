# Repair Module API Documentation

## Installation & Registration

1. Add the plugin to your `medusa-config.ts` (Medusa v2):

```typescript
import { defineConfig } from '@medusajs/framework/utils'

export default defineConfig({
  projectConfig: {
    // ... 
  },
  modules: [
    {
      resolve: "@enomshop/repair-module",
    }
  ]
})
```

2. Run database migrations to install the new models natively into your Medusa application:
```bash
npx medusa db:migrate
```

## Accessing the Admin Backend

Because this plugin includes an admin extension (`src/admin/routes/dashboard/repairs/page.tsx`), once properly registered and built along with your Medusa project, a new **Repairs** item with a Wrench icon will automatically appear in your Medusa Admin portal sidebar under Dashboard.

You can also browse directly to `/app/dashboard/repairs` in your admin dashboard.

### Overview
Complete Repair Management System for device repair shops with customer tracking, parts management, chat functionality, cost approval flow, and warranty tracking.

## Core Data Models
- **Device**: Tracks device details, condition, and owner.
- **RepairTicket**: Manages repair status, cost estimates, approval flow, and warranty info.
- **RepairMedia**: Stores defect photos and repair videos.
- **RepairNote**: Internal or customer-visible notes on the repair.
- **RepairUpdate**: Chat messages between staff and customers.

## API Endpoints Summary

### Admin REST API
Base path: `/admin/repairs`
- `GET /` & `GET /:id` - Retrieve and search repair tickets
- `POST /` - Create a new repair ticket & check-in device
- `POST /:id/status` - Update repair status and ETC
- `POST /:id/parts` - Link Medusa ProductVariants to repairs (respects B2Pricing)
- `POST /:id/costs` - Update labor and part cost estimates
- `POST /:id/media`, `/notes`, `/messages` - Add related ticket data

### Storefront REST API
Base path: `/store/repairs`
- `GET /:serial_number` - Customer tracks repair by device serial number
- `POST /:id/approve` - Customer approves cost to start repair
- `GET /:id/messages` & `POST /:id/messages` - Customer chat interface

## Workflows
The module utilizes Medusa Workflows for core transactional actions:
- `createRepairTicketWorkflow`
- `updateRepairStatusWorkflow` (Emits `repair.status_changed` event)
- `approveRepairCostWorkflow`
- `addRepairPartsWorkflow`

## Admin UI Extensions
The module injects the following pages into your Admin Dashboard:
- **Repair List Page** (`/app/dashboard/repairs`): View, filter, and search repair workloads.
- **Repair Detail Page** (`/app/dashboard/repairs/:id`): Manage status, chat, attachments, and update costs.
- **Repair Ticket Widget**: Custom widget on order pages to see related active repairs.

## Storefront Integration (Deno / Fresh)
The Repair Module includes a complete storefront interface for tracking. The frontend is built on Fresh.js v2.3 in the `storefront/` directory.

### Integrating the Storefront

The frontend code is provided in the `storefront/` directory of this module. To use it in your Deno / Fresh project, you simply need to copy the files over:

1. **Copy Routes:** Copy the `storefront/routes/` directory into your Fresh project's `routes/` directory. If you want the route to be at `/repairs/track`, ensure the file is at `routes/repairs/track.tsx`.
2. **Copy Islands:** Copy the `storefront/islands/` directory into your Fresh project's `islands/` directory (e.g. `islands/TopProgressBarIsland.tsx`). 
   - Note: There are also co-located islands in `routes/repairs/(_islands)/TrackRepairIsland.tsx`. These can remain co-located or be moved to your global `islands/` directory depending on your preference.
3. **Environment Setup:** Make sure your Fresh project is configured to hit the backend where your Medusa project is running. Update any backend URL constants (like `MEDUSA_BACKEND_URL`) in `TrackRepairIsland.tsx` if necessary.

### Storefront Routes

**Location:** `routes/repairs/track.tsx`
**Client Island:** `routes/repairs/(_islands)/TrackRepairIsland.tsx`

**Features:**
- Serial number search to find repair tickets
- Real-time status display with progress bar
- Cost breakdown with approval flow
- Media gallery (device photos)
- Timeline with ETC and warranty info
- Customer-visible notes and updates
- Inline cost approval button
- Built-in Freshjs partial support for SPA-like navigation
- Seamless Github-style loading bar via `islands/TopProgressBarIsland.tsx`

### Adding to Navigation

Add a link to your Freshjs storefront navigation using `f-client-nav` for partial SPA navigation:

```tsx
<a href="/repairs/track" f-client-nav>Track Repair</a>
```

### QR Code Integration

Generate QR codes linking to tracking page with serial number:

```
https://yourstore.com/us/repairs/track?sn=ABC123XYZ
```

Then pre-fill the search field on page load by reading the `sn` query parameter.

### SMS/WhatsApp Links

Send customers direct links to track their repairs:

```
Hi John, track your repair here: https://yourstore.com/us/repairs/track?sn=ABC123
```

## Advanced Features Included

- **Price Groups**: Admin `/parts` endpoints seamlessly fetch custom B2B pricing for individual repair tickets.
- **Technician Tracking**: Assign employees to devices to keep tabs on workbench workload.
- **Events Support**: `repair.status_changed` acts as a hook to integrate email/SMS subscriber notifications.


## Next Steps

1. **Notification Integration:** Add SMS/WhatsApp/Email in subscriber (`src/subscribers/repair-status-changed.ts`)
2. **File Upload Routes:** Add multer-based upload endpoints for media
3. **PDF Generation:** Job cards and receipts with QR codes
4. **Reporting:** Analytics on repair times, costs, warranty claims
5. **Customer Accounts:** Link repairs to customer dashboard
6. **Inventory Integration:** Auto-deduct parts when repair is completed

---

**Built with Medusa 2.13.5**
