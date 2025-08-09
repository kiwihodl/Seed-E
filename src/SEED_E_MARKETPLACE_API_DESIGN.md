# Seed‑E Marketplace API Design (Add‑Ons, Shipping, Service Types)

## 0. Goals

- Support add‑ons (blank plates, sleeves) with pricing
- Shipping destinations with fee rules (per region and per recipient)
- Two distinct service types:
  1. One‑time key creation & shipping
  2. Managed key (provider holds; later sign or ship)
- Keep the design simple to ship now; backward‑compat is not a blocker at this stage

### Glossary

- **SKU**: Stock‑Keeping Unit. A provider‑defined identifier (string) for a sellable item (e.g., `SLV-SEEDSLEEVE`, `PLT-SS-STEEL`). Used to price and track add‑ons like sleeves and blank plates.

## 1. Current Architecture (baseline)

- Discovery: `GET /api/services`
- Purchase: `POST /api/clients/purchase` → Lightning invoice (setup fee)
- Purchased services for client: `GET /api/clients/purchased-services?clientId=…`
- Signature workflow: `POST /api/signature-requests/create`, polling via `GET /api/signature-requests/client?clientId=…`
- LNURL verify server‑side; no dependency on Voltage

## 2. New Concepts & Data Model Extensions

### 2.1 Service types

- Add enum `serviceType`: `ONE_TIME` | `MANAGED`
- Store on `Service` model: `serviceType` (default `ONE_TIME`)

### 2.2 Materials (catalog)

- Materials/add‑ons are offered per provider/service:
  - `sleeves`: `{ sku, name, description, priceSats, shipFeeSatsPerOrder?: number, shipFeeSatsPerRecipient?: number, shipUnits?: number }[]` (two sleeve types supported)
    - Example SKUs: `SLV-SEEDSLEEVE` (tamper‑evident sleeve), `SLV-MAILER` (standard mailer)
  - `blankPlates`: `{ sku, name, description, priceSats, shipFeeSatsPerOrder?: number, shipFeeSatsPerRecipient?: number, shipUnits?: number }[]`
  - Shipping fee fields are optional and provider-defined:
    - `shipFeeSatsPerOrder`: flat shipping fee for this SKU per order
    - `shipFeeSatsPerRecipient`: shipping fee multiplied by number of recipients
    - `shipUnits`: lightweight, provider-defined shipping unit weight/volume for packaging tiers (e.g., sleeves 0.1, plates 1)

### 2.3 Shipping policy & fees (privacy-preserving)

- Per service the provider defines a shipping policy without revealing their origin:
  - `shippingPolicy` (one of):
    - `FLAT_PER_RECIPIENT`: `{ mode: "FLAT", flatFeeSats: number, shipsTo: { regionCode, regionName }[] }`
      - Shipping fee = `flatFeeSats * recipientsCount`
    - `REGION_BASED`: `{ mode: "REGION_BASED", regions: { regionCode, regionName, baseFeeSats, perRecipientMultiplier?: number }[] }`
      - Shipping fee per recipient = `baseFeeSats * (perRecipientMultiplier || 1)`
      - Total shipping fee = sum of per‑recipient fees
  - Tracking is always included by default; providers should price it into base fees. Tracking numbers are returned post‑fulfillment via encrypted fields.
  - Optional `packagingTiers` (applied per recipient): `{ tiers: [{ maxUnits: number, multiplier: number }], defaultMultiplier: number }`
    - Compute `totalShipUnitsPerRecipient` = sum(add‑on `shipUnits` × qty destined for that recipient)
    - Apply the first tier where `totalShipUnitsPerRecipient <= maxUnits`; otherwise apply the highest tier multiplier
    - Example tiers: `[{ maxUnits: 5, multiplier: 1 }, { maxUnits: 10, multiplier: 2 }, { maxUnits: 999, multiplier: 3 }]`
  - Optional `packagingTiersPerOrder` (applied to the whole order): `{ tiers: [{ maxUnits: number, multiplier: number }], defaultMultiplier: number }`
    - Compute `totalShipUnitsOrder` = sum of recipients' shipUnits
    - Apply this multiplier to the post–per‑recipient‑tier shipping total for the order
    - Example: `[{ maxUnits: 5, multiplier: 1 }, { maxUnits: 10, multiplier: 2 }]` implements “>5 plates total doubles shipping”
  - Optional `progressiveSkuMultipliers` (per recipient):
    - Rules applied by SKU family before tiers: `[{ skuFamily: "sleeves" | "blankPlates", stepQty: number, multiplierPerStep: number }]`
    - Effective multiplier = product over rules of `multiplierPerStep ^ floor(qtyForFamily / stepQty)`
    - Default for Seed‑E: `[ { skuFamily: "sleeves", stepQty: 2, multiplierPerStep: 1.5 }, { skuFamily: "blankPlates", stepQty: 5, multiplierPerStep: 1.5 } ]`
  - `leadTimeBusinessDays?: number` (weekends excluded)
  - `blackoutDates?: string[]` (ISO dates; no fulfillment during these days)

### 2.4 Orders (configuration captured at purchase time)

- New `Order` entity (linked to `ServicePurchase`):
  - `id, clientId, serviceId, serviceType`
  - `requestedStampedCopies: number` (ONE_TIME)
  - `requestedBlankPlates: { sku, quantity }[]`
  - `requestedSleeves: { sku, quantity }[]`
  - `recipients: { alias: string; regionCode: string; encryptedAddressPayload?: string }[]` (alias now; encrypted payload later)
  - `pricingBreakdown: { setupFee, materialsFee, shippingFee, total }`
  - `createdAt: Date` (timestamp when the order was created)
  - `status: PENDING | PROCESSING | COMPLETED | CANCELLED`
  - `limits: { maxRecipients: 21 }` (server‑enforced)
- Key creation timestamp: use `Service.createdAt` (provider’s key creation time) already present — no separate `manufacturedAt` field needed.

### 2.5 Managed key actions

- For `MANAGED` services, signature requests must specify intent:
  - `action: "SIGN" | "SHIP"`
  - `SHIP` requires recipients + (optional) shipping add‑ons; server calculates fulfillment invoice.
  - Enforce 7‑day minimum time delay as today.

## 3. API Additions (to enable pre‑purchase configuration)

### 3.1 Discovery (lightweight)

- `GET /api/services` → each service gains minimal flags:
  - `serviceType`
  - `hasMaterials: boolean` (true if any sleeves/plates defined)
  - `shippingPolicySummary`:
    - For FLAT: `{ mode: "FLAT", shipsTo: { regionCode, regionName }[] }`
    - For REGION_BASED: `{ mode: "REGION_BASED", regions: { regionCode, regionName }[] }`
  - `leadTimeBusinessDays?`

### 3.2 Service details (full config for purchase UI)

- `GET /api/services/{id}` → detailed object for the chosen service:
  ```json
  {
    "serviceId": "...",
    "providerName": "...",
    "serviceType": "ONE_TIME" | "MANAGED",
    "fees": { "setupFee": 50000, "signingFee": 10000, "annualFee": 25000 },
    "materials": {
      "sleeves": [ { "sku": "SLV-SEEDSLEEVE", "name": "SeedSleeve", "description": "tamper‑evident", "priceSats": 5000, "shipUnits": 0.1 }, { "sku": "SLV-MAILER", "name": "Mailer", "description": "standard", "priceSats": 2000, "shipUnits": 0.1 } ],
      "blankPlates": [ { "sku": "PLT-SS-STEEL", "name": "Steel Plate", "description": "316L", "priceSats": 8000, "shipUnits": 1 } ]
    },
    "shippingPolicy": {
      "mode": "REGION_BASED",
      "regions": [
        { "regionCode": "US-CA", "regionName": "California", "baseFeeSats": 10000, "perRecipientMultiplier": 1 },
        { "regionCode": "US-NY", "regionName": "New York", "baseFeeSats": 12000, "perRecipientMultiplier": 2 }
      ],
      "packagingTiers": { "tiers": [ { "maxUnits": 5, "multiplier": 1 }, { "maxUnits": 10, "multiplier": 2 }, { "maxUnits": 999, "multiplier": 3 } ], "defaultMultiplier": 1 },
      "leadTimeBusinessDays": 5,
      "blackoutDates": ["2025-12-25"]
    },
    "createdAt": "2025-08-01T00:00:00Z"
  }
  ```
- BTC Keeper uses this to present sleeves (two types), blank plates, recipients, and region selection **before purchase**.

### 3.3 Quote endpoint (server‑side pricing)

- `POST /api/clients/quote`
  - Request:
    ```json
    {
      "serviceId": "...",
      "serviceType": "ONE_TIME",
      "stampedCopies": 2,
      "blankPlates": [{ "sku": "PLT-SS-STEEL", "quantity": 3 }],
      "sleeves": [
        { "sku": "SLV-SEEDSLEEVE", "quantity": 2 },
        { "sku": "SLV-MAILER", "quantity": 1 }
      ],
      "recipients": [
        {
          "alias": "Client PO Box",
          "regionCode": "US-CA",
          "items": [{ "sku": "PLT-SS-STEEL", "quantity": 2 }]
        },
        {
          "alias": "Advisor PO Box",
          "regionCode": "US-NY",
          "items": [{ "sku": "PLT-SS-STEEL", "quantity": 1 }]
        }
      ]
    }
    ```
  - Server enforces `shipsTo`/supported regions and returns an error if any recipient region is unsupported.
  - If `recipients[].items` omitted, server distributes global add‑on quantities evenly across recipients; otherwise uses per‑recipient overrides.
  - Response (authoritative server calc):
    ```json
    {
      "quoteId": "...",
      "pricingBreakdown": {
        "setupFee": 50000,
        "materialsFee": 30000,
        "shippingFee": 20000,
        "total": 100000
      },
      "expiresAt": "2025-08-01T12:00:00Z"
    }
    ```

### 3.4 Purchase with configuration

- Use `POST /api/services/purchase` to accept inline configuration (same shape as quote request). Server persists `orderConfig` and `pricingBreakdown` on `ServicePurchase`.

### 3.5 Managed service signature request

- Extend `POST /api/signature-requests/create` with optional fulfillment fields (only for `MANAGED` + `SHIP`):
  ```json
  {
    "action": "SIGN" | "SHIP",
    "recipients": [{ "alias": "...", "regionCode": "..." }],
    "addOns": {
      "blankPlates": [{ "sku": "...", "quantity": 1 }],
      "sleeves": [{ "sku": "...", "quantity": 1 }]
    }
  }
  ```
- Server returns an invoice for fulfillment when applicable, and associates it with the signature request ID.

## 4. Pricing Rules (server‑side)

- Shipping fee
  - If `shippingPolicy.mode == FLAT`: `flatFeeSats * recipientsCount`
  - If `shippingPolicy.mode == REGION_BASED`: sum of per‑recipient base fees from region rules
  - “Double fee for >1 address” can be modeled via `perRecipientMultiplier = 2`
- Materials fee = sum of (item.priceSats × qty) across `blankPlates`, `sleeves`
- Prices are configured in provider Admin UI in fiat (USD/AUD/NZD). On save, values are stored canonically as USD in `priceUsd`. At quote time, server converts to sats via `SATS_PER_USD`.
- Materials fee = sum of (priceSats × qty), where `priceSats` is derived from `priceUsd * SATS_PER_USD`.
- Add‑on shipping fees (per SKU)
  - `shipFeeSatsPerOrder` added once per order (× qty)
  - `shipFeeSatsPerRecipient` multiplied by `recipientsCount` (× qty)
- Packaging tiers (per recipient)
  - Compute total ship units per recipient from `recipients[].items` (or evenly distribute global add‑ons)
  - Apply `packagingTiers.multiplier` to that recipient’s base shipping fee
  - Example policy: backup plates beyond 5 units per recipient triggers 2×; beyond 10 triggers 3×
- Packaging tiers per order (optional)
  - Compute total ship units across all recipients; apply `packagingTiersPerOrder.multiplier` to the sum of per‑recipient shipping after their individual tier multipliers
- Progressive SKU multipliers (per recipient, optional)
  - For each configured rule, compute `m = multiplierPerStep ^ floor(qtyForFamily / stepQty)` and multiply recipient’s base shipping by `m` before packaging tiers
  - Seed‑E default: sleeves add 1.5× per 2 sleeves; plates add 1.5× per 5 plates
- Tracking is assumed in base shipping fees; tracking numbers are always provided post‑fulfillment
- Setup fee = existing `initialBackupFee`
- Signature fee (managed only) = existing `perSignatureFee`
- Total = sum of relevant components; server is the source of truth

## 5. Client UX (BTC Keeper)

- ONE_TIME:
  - Discovery → Details (`GET /services/{id}`) → Configure (stamped copies, add‑ons, recipients) → `POST /clients/quote` → Purchase invoice → Status
- MANAGED:
  - Discovery → Details → Purchase setup → Manager
  - Signature modal asks: **Sign** or **Ship**
    - If Ship: collect recipients + add‑ons → server returns fulfillment invoice → poll status
- Address handling now: **alias‑only**; later encrypted payload (client‑side encrypted to provider pubkey)
- Purchased view includes provider contact (Keybase) and shipment tracking entries (encrypted at rest) via `GET /api/clients/purchased-services`.
- Display shipping tier thresholds and warn when selections push into the next tier (client‑side). Server response is authoritative for totals.

## 6. Backward Compatibility

- Not a hard requirement now; new endpoints and fields are additive.

## 7. Phased Rollout

1. Phase A (unblock integration)
   - Add `GET /api/services/{id}` (details)
   - Extend `GET /api/services` with `serviceType` and `hasMaterials`
   - Add `POST /api/clients/quote`
   - Accept `quoteId` in `POST /api/clients/purchase`
   - Alias‑only recipients (no encryption yet)
2. Phase B

- Extend signature requests with `action` + optional shipping of plates/sleeves (managed only)
- Materials & shipping provider endpoints (or admin UI seeding)

3. Phase C
   - Encrypted address payloads, provider pubkey distribution
   - Provider order dashboards & fulfillment events

## 8. Open Questions

- Single invoice vs separate invoices (materials vs setup)? Proposed: single invoice at purchase; for `MANAGED`, purchase is single invoice; later SHIP fulfillment invoices as needed.
- Per‑region inventory availability flags (optional)?
- SLA/lead‑time per service — helpful for UI estimates.

## 9. Managed subscription specifics

- Replace monthly with annual for MANAGED services; allow multi‑year purchase (max 10 years)
- `GET /services/{id}` includes `{ annualFee, supportsMultiYear: true, maxYears: 10 }`
- `POST /clients/quote` and `purchase` accept `{ years?: number }` for MANAGED (default 1; max 10)
- Total for MANAGED purchase includes `annualFee * years`

## 10. Tracking data (privacy and access)

- Tracking numbers are stored per recipient after fulfillment and are encrypted at rest
- Exposed via client/provider authenticated endpoints only
- Suggested shape under Order:
  - `shipments: [{ recipientAlias, regionCode, trackingCarrier?: string, trackingNumberEncrypted: EncryptedField, shippedAt?: string }]`

### Tracking update endpoint (provider-only)

- `POST /api/providers/orders/{orderId}/shipments`
  - Auth: provider who owns the order’s service
  - Body: `{ shipments: [{ recipientAlias, regionCode, trackingCarrier?: string, trackingNumber: string, shippedAt?: string }] }`
  - Behavior: updates or creates shipment entries per recipient; server encrypts `trackingNumber` at rest
  - Only shipment fields are mutable; all other order fields remain immutable once purchased
  - Response: `{ success: true }`

## 11. Provider defaults and service overrides

- Provider-level defaults to avoid repetition:
  - `shippingPolicyDefault`: same shape as `shippingPolicy` (tracking implied)
  - `materialsCatalog`: provider’s sleeves and blank plates with prices and shipping metadata. Prices stored as `priceUsd` (canonical). Legacy `priceSats` supported if present.
- Service-level overrides (optional, partial):
  - `shippingOverrides`: override only what differs (e.g., add a region, tweak multiplier)
  - `materialsOverrides`: per-SKU price or availability overrides
- Effective config used by client APIs:
  - `effectiveShipping = merge(shippingPolicyDefault, shippingOverrides)`
  - `effectiveMaterials = merge(materialsCatalog, materialsOverrides)`
- Editing model:
  - Provider defaults are set once via Admin UI (non-public). No public API for arbitrary updates.
  - Client: `GET /api/services`, `GET /api/services/{id}` expose effective config; quote/purchase use it

---

This update clarifies SKUs, ensures add‑ons (sleeves/plates) and recipients are chosen **before purchase**, introduces a service‑details endpoint for full configuration, and replaces `manufacturedAt` with existing timestamps. It preserves today’s working flows while enabling the expanded marketplace without blocking BTC Keeper integration.
