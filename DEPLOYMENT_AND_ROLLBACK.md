# Diaspora Point Connect — Production Deployment, Backup & Rollback Runbook

## 1. Environment & Infrastructure Targets
- **Firebase Project ID**: `coherent-stacker-mdtd0`
- **Firestore Database ID**: `ai-studio-diasporapointcon-16cbf61e-1397-41b2-9f0c-e712d2745b13`
- **Production Entry Point**: `npm run build && npm run start` (`node server.ts` on `PORT=3000` / Cloud Run `$PORT`)
- **Required Server-Side Secrets** (never prefix with `VITE_`):
  - `PESAPAL_ENV` (`sandbox` or `live`)
  - `PESAPAL_CONSUMER_KEY`, `PESAPAL_CONSUMER_SECRET`, `PESAPAL_IPN_ID`
  - `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (or ADC / `GOOGLE_APPLICATION_CREDENTIALS`)
  - `APP_URL` (canonical HTTPS origin for PesaPal callback and IPN URLs)

## 2. Pre-Launch Verification Gate
Run before every production deployment:
```bash
npm run lint:rules
npm run lint
npm test
npm run build
```
Verify live production server endpoints:
- `GET /api/health` → `200 OK` (`status: "healthy"`, `firebaseProjectId`, `firestoreDatabaseId`)
- `GET /api/fx-rates` → `200 OK` (`USD`, `KES`, `GBP`, `EUR`)
- `GET /` → `200 OK` serving built `dist/index.html`
- `GET /robots.txt` & `GET /sitemap.xml` & `GET /pwa-192x192.png` → `200 OK`

## 3. Firestore Scheduled Backups & Manual Export
Enable automated daily Firestore backups and perform pre-release manual snapshots:
```bash
# 1. Create a pre-deployment managed export to GCS
gcloud firestore export gs://coherent-stacker-mdtd0-backups/manual-$(date +%Y%m%d-%H%M%S) \
  --project=coherent-stacker-mdtd0 \
  --database=ai-studio-diasporapointcon-16cbf61e-1397-41b2-9f0c-e712d2745b13

# 2. Verify daily scheduled backup policy exists (or create 1-day schedule with 7-day retention)
gcloud firestore backups schedules list \
  --project=coherent-stacker-mdtd0 \
  --database=ai-studio-diasporapointcon-16cbf61e-1397-41b2-9f0c-e712d2745b13
```
Critical collections included in snapshot backups:
- `users`, `users/*/recipients`, `orders`, `paymentTransactions`, `products`, `categories`, `inventoryRecords`, `stockMovements`, `suppliers`, `deliveryZones`, `drivers`, `coupons`, `promotions`, `campaigns`, `cmsSections`, `config`, `supportTickets`, `productReviews`, `auditLogs`.

## 4. Rollback Procedures

### A. Firestore Security Rules Rollback
If a rules release unexpectedly blocks authorized operations:
1. Check rule revision history in Firebase Console (`Firestore Database -> Rules -> Version history`) or `git checkout <last-good-commit> -- firestore.rules`.
2. Re-validate with `npx eslint firestore.rules`.
3. Redeploy the previous known-good ruleset immediately (`DeployRules`).

### B. Application / Cloud Run Revision Rollback
1. List active Cloud Run revisions:
   ```bash
   gcloud run revisions list --service=<service-name> --region=europe-west2 --project=coherent-stacker-mdtd0
   ```
2. Route 100% traffic back to the previous healthy revision:
   ```bash
   gcloud run services update-traffic <service-name> \
     --to-revisions=<previous-healthy-revision>=100 \
     --region=europe-west2 \
     --project=coherent-stacker-mdtd0
   ```

### C. Firestore Data Restoration (Disaster Recovery)
```bash
gcloud firestore import gs://coherent-stacker-mdtd0-backups/<backup-folder> \
  --project=coherent-stacker-mdtd0 \
  --database=ai-studio-diasporapointcon-16cbf61e-1397-41b2-9f0c-e712d2745b13
```
Note: Never clear live production collections before exporting a point-in-time snapshot.

### D. Payment Gateway Cutover & Emergency Pause
- If PesaPal upstream issues occur, verify `/api/payments/pesapal/verify` continues polling idempotently without double-confirming (`paymentTransactions/{trackingId}` atomic guard).
- Do **not** manually mark `paymentStatus = 'PAID'` without verified settlement in PesaPal Merchant Portal.

### E. SUPER_ADMIN Recovery
- Verified bootstrap administrator `masesawilson3@gmail.com` retains fallback `SUPER_ADMIN` recovery in both Firestore Rules (`isSuperAdmin()`) and server middleware (`auth.ts`), even if role documents are corrupted.
