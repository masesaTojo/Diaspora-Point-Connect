# Security Specification - Diaspora Point Connect

## Data Invariants
1. A user profile cannot be created for a UID other than the authenticated user.
2. A product must have a valid price and status.
3. An order must belong to the user who created it.

## The "Dirty Dozen" Payloads (PERMISSION_DENIED)
1. Creating a user profile for a different UID.
2. Updating another user's profile.
3. Deleting a product (Public user).
4. Updating product price (Public user).
5. Creating an order with a total of $0.00.
6. Reading audit logs (Non-admin).
7. Updating product inventory (Public user).
8. Updating delivery zones (Public user).
9. Updating CMS sections (Public user).
10. Reading all orders (Public user).
11. Bypassing email verification (if mandated).
12. Setting oneself as SUPER_ADMIN.

## Test Runner (Logic Check)
- verify(isSignedIn() && isOwner(userId)) for `users`.
- verify(isAdmin()) for `auditLogs`.
- verify(isPublicReadable()) for `products`, `categories`.
