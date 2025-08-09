# Seed‑E Rollout Strategy: Provider Admin + API Updates

## 0. Goals (what changes for vNext)

- Provider Admin UI: single place to set shipping defaults, materials catalog, currency (USD/AUD/NZD), and Keybase handle (required). Services inherit these; overrides are optional.
- Client API: expose effective shipping/materials, add quote flow, and keep contact off‑platform. Keybase revealed only after purchase.
- Service listing/detail: show add‑on availability, allow pre‑purchase configuration (plates, sleeves), and produce a server quote prior to purchase.
- Tracking: providers can attach encrypted tracking numbers per recipient after fulfillment (only mutable field post‑purchase).

## 1. Data Model (Prisma) deltas

- Provider

  - Add `keybaseHandle: String` (required)
  - Add `shippingPolicyDefault: Json` (global provider defaults)
  - Add `materialsCatalog: Json` (sleeves, blankPlates, with pricing + shipping metadata)

- Service (minimal, override‑only)

  - Add `serviceType: ONE_TIME | MANAGED` (default ONE_TIME)
  - Add `shippingOverrides: Json?` (partial override of provider defaults)
  - Add `materialsOverrides: Json?`
  - Keep existing fee fields (initialBackupFee, perSignatureFee, annualFee)

- Order (linked to ServicePurchase)
  - `recipients: Json` (alias + regionCode + per‑recipient items)
  - `pricingBreakdown: Json`
  - `shipments: Json?` (provider‑supplied tracking entries: carrier?, trackingNumberEncrypted, shippedAt)
  - `limits: Json?` (server enforced, e.g., { maxRecipients: 21 })

Notes: All new Json fields can be indexed later if needed; start simple.

## 2. APIs to add/update

### 2.1 Provider Admin (authenticated as provider)

- GET `/api/providers/config` → { keybaseHandle, shippingPolicyDefault, materialsCatalog } [Implemented]
- PUT `/api/providers/config` → update the above (Admin UI calls this). Tracking is always implied in base shipping; no toggle. [Implemented]

### 2.2 Client discovery and details

- GET `/api/services` (extend): include
- `serviceType`, `hasMaterials`, `shippingPolicySummary` (shipsTo or region names), `leadTimeBusinessDays` [Implemented]
- GET `/api/services/{id}` (new): full effective details [Implemented]
  - `fees`, `materials` (from effectiveMaterials), `shippingPolicy` (from effectiveShipping), `createdAt`

### 2.3 Quoting and purchase

- POST `/api/clients/quote` (new) [Implemented]
  - Input: serviceId, serviceType, add‑ons (sleeves/blankPlates with qty), recipients (alias, regionCode, optional per‑recipient items)
  - Validates: shipsTo, maxRecipients (<=21)
  - Computes: setup + materials + shipping with progressive multipliers, per‑recipient tiers, and optional per‑order tier
  - Output: quoteId, pricingBreakdown, expiresAt (placeholders for Phase A)
- POST `/api/services/purchase` (extend) [Implemented]
  - Accepts inline config; persists `orderConfig` and `pricingBreakdown` on `ServicePurchase`
  - MANAGED supports `{ years?: 1..10 }` → total includes `annualFee * years`

### 2.4 Managed fulfillment and tracking

- POST `/api/signature-requests/create` (extend) [Pending]
  - For MANAGED `action: "SIGN" | "SHIP"`; SHIP returns fulfillment invoice using same pricing rules
- POST `/api/providers/orders/{orderId}/shipments` (new, provider‑only) [Implemented]
  - Body: `{ shipments: [{ recipientAlias, regionCode, trackingCarrier?, trackingNumber, shippedAt? }] }`
  - Encrypts trackingNumber; only shipment fields mutable

### 2.5 Purchased services

- GET `/api/clients/purchased-services` (extend) [Implemented]
  - Includes `providerKeybase` and `shipments` in response

## 3. Provider Admin UI changes (new screens/edits)

### 3.1 Settings → Shipping & Materials (single edit form)

- Required Keybase handle
- Shipping defaults:
  - Mode: FLAT_PER_RECIPIENT or REGION_BASED
  - shipsTo (regions) OR regions with { baseFeeSats, perRecipientMultiplier? }
  - Packaging tiers (per recipient) and optional per‑order tiers
  - Progressive SKU multipliers: sleeves 1.5× per 2; plates 1.5× per 5 (pre‑populated defaults)
  - Lead time (business days), blackout dates (calendar picker)
- Materials catalog (prices entered in selected currency and saved as `priceUsd`):
  - Sleeves: [{ sku, name, priceUsd, shipUnits?, shipFeeSatsPerOrder?, shipFeeSatsPerRecipient? }]
  - Blank plates: same fields; step sizes optional (we keep no min‑order requirement)
- Save updates via PUT `/api/providers/config` (with optimistic UI)

Gating: Add Key is blocked until provider sets Keybase handle and shipping defaults (enforced server‑side in `/api/providers/policies`).

### 3.2 Add Key (Service) form (edits)

- Fields: `serviceType`, `initialBackupFee`, `perSignatureFee`, `annualFee (managed)`
- Show “Provider defaults in effect” summary (shipping + materials). Allow optional per‑service overrides in an advanced collapsible.
- Display computed “Total setup price” preview for typical 1‑recipient case (purely informational; true total comes from quote at client side)

## 4. Client UI (cards, details, purchase)

- Listing cards (`GET /api/services`): show
  - serviceType, createdAt, has add‑ons, shipsTo summary, lead time
- Service details (`GET /api/services/{id}`):
  - Configure stamped copies (if shown), sleeves/plates qty, recipients (alias + region)
  - Call `POST /api/clients/quote` → show pricing breakdown and totals
  - Proceed to purchase → `POST /api/clients/purchase`
- Purchased view:
  - Reveal provider Keybase handle (only after purchase)
  - Show shipment tracking entries (decrypted server‑side, displayed to owner)

## 5. Pricing mechanics (server authority)

Order of operations per recipient: base shipping (flat or region), apply progressive SKU multipliers (sleeves + plates), then packaging tiers. Sum across recipients, then optionally apply per‑order tier. Add materials fee and setup fee. Managed SHIP fulfillment uses same rules.

## 6. Security & privacy

- Tracking numbers encrypted at rest; only provider and purchasing client can access
- Addresses alias‑only for now; future: encrypted payload to provider pubkey
- Keybase handle required; revealed post‑purchase only

## 7. Rollout plan (Phase A → B)

- Phase A (ship now)
  - Prisma deltas for Provider defaults, Service overrides, minimal Order fields [Done]
  - Implement: GET services (extended) [Done], GET service details [Done], POST quote [Done], extend purchase [Done]
  - Admin UI: provider config page (shipping/materials/keybase) [Pending], Add Key edits [Pending]
  - Purchased view reveals Keybase; provider shipment endpoint (basic) [Done]

## 10. Progress (live)

- Schema
  - Provider defaults + Service overrides + Purchase order fields [Done]
- Library
  - Pricing engine in `src/lib/pricing.ts` (progressive multipliers, tiers; supports `priceUsd`→sats via `SATS_PER_USD`) [Done]
- APIs
  - GET `/api/services/{id}` details [Done]
  - POST `/api/clients/quote` [Done]
  - GET/PUT `/api/providers/config` [Done]
  - GET `/api/services` (extend) [Done]
  - POST `/api/services/purchase` (extend) [Done]
  - POST `/api/providers/orders/{orderId}/shipments` [Done]
  - GET `/api/clients/purchased-services` (extend) [Done]
- UI
  - Provider Admin Settings (defaults + keybase) [Pending]
  - Add Key form (show defaults, optional overrides) [Pending]
  - Client purchased view (show Keybase + tracking) [Pending]
- Infra
  - Prisma migration for new fields [Pending]
  - Env: `SATS_PER_USD` required for quote conversion; optional `USD_PER_AUD`, `USD_PER_NZD` for Admin UI currency conversion (fallback defaults used if absent) [Note]
- Phase B
  - MANAGED SHIP fulfillment invoice path
  - Provider shipments UI and endpoint (tracking updates)
  - Optional per‑order tiering if not already in A

## 8. Acceptance criteria (must have)

- Provider can set shipping defaults, materials, and Keybase once in Admin UI
- Client can discover services, see add‑ons, configure, get a quote, and purchase
- After purchase, Keybase shows; provider can add tracking; client can view it
- Pricing matches server rules (multipliers, tiers, shipsTo validation)

## 9. Non‑goals (for later)

- In‑app messaging (stay off‑platform)
- Taxes/duties, insurance options UI, inventory management
- Address encryption payloads (planned in later phase)
