# Security & Production Readiness Specification - Diaspora Point Connect

## Data & Operational Invariants
1. User profiles (`users/{userId}`) require verified email (`email_verified == true`), matching `uid == userId`, self-registration pinned strictly to `['CUSTOMER']`, and role updates strictly gated to `SUPER_ADMIN`.
2. Saved Kenya recipients (`users/{userId}/recipients/{recipientId}`) are strictly owner-only (`request.auth.uid == userId`) and email-verified.
3. Orders (`orders/{orderId}`) cannot be created client-side as `PAID`, `CONFIRMED`, or `$0.00`; authoritative checkout totals, FX conversions, coupon redemptions, and atomic stock deductions run server-side via Firebase Admin SDK (`POST /api/orders/checkout` + `POST /api/payments/pesapal/*`).
4. Payment transaction ledgers (`paymentTransactions/{trackingId}`) are server-written only (`allow write: if false;` on client SDK) and readable only by the owning customer or order staff.
5. Audit logs (`auditLogs/{id}`) are append-only (`update, delete: if false`) and readable strictly by `SUPER_ADMIN`.
6. Support inquiries (`supportTickets/{ticketId}`) force `status == 'OPEN'` on creation, prevent `customerId` spoofing, isolate customer reads to the ticket owner, and restrict triage updates to `isSupportStaff()` (`SUPER_ADMIN`, `STORE_MANAGER`, `ORDER_MANAGER`, `SUPPORT_AGENT`).
7. Customer reviews (`productReviews/{reviewId}`) require verified authentication, validate ratings (`1..5`) and comment length (`3..2000`), remain immutable on update, and restrict deletion to owner or `isCatalogAdmin()`.
8. Default safety net (`match /{document=**}`) denies all unspecified reads and writes.

## Protected Collections (20 Documented in `firebase-blueprint.json`)
- Identity & Access: `users`, `users/{userId}/recipients`, `admins`, `auditLogs`
- Storefront & Catalog: `products`, `categories`, `cmsSections`, `config`, `productReviews`
- Inventory & Procurement: `inventoryRecords`, `stockMovements`, `suppliers`
- Commerce & Fulfillment: `orders`, `paymentTransactions`, `deliveryZones`, `drivers`
- Marketing & Concierge: `coupons`, `promotions`, `campaigns`, `supportTickets`

## Server & Runtime Controls
- Express security headers (`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`) with `x-powered-by` disabled.
- Server-authoritative FX endpoint (`GET /api/fx-rates`) shared between UI display (`ShopContext`) and backend checkout (`orderService.ts`).
- RFC-4180 CSV export helper (`src/lib/csv.ts`) neutralizing spreadsheet formula injection (`=`, `+`, `-`, `@`, `\t`, `\r`).
- PWA manifest icons (`192x192`, `512x512`, `maskable`, `apple-touch-icon.png`, `favicon.ico`) and Schema.org JSON-LD metadata in `index.html`.
