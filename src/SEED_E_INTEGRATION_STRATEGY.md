# Seed-E Key Marketplace Integration Strategy for BTC Keeper

## Executive Summary

This document outlines the integration strategy for bringing Seed-E's P2P collaborative Bitcoin custody platform into BTC Keeper as a "Key Marketplace" option. The integration will allow BTC Keeper users to purchase professional key management services from trusted providers through Seed-E's platform.

## Integration Overview

### Two Service Types

1. **One-Time Key Creation & Delivery Service**

   - Provider creates key, uploads blinded xpub (BIP32)
   - Creates steel copies using seedstamp technology
   - Ships to client's PO Box and/or trusted third parties
   - Optional wallet descriptor inclusion
   - **Payment**: One-time fee via Lightning

2. **Ongoing Key Management Service**
   - Same as above PLUS ongoing key custody
   - Provider holds key and can sign when requested
   - Annual fee + optional per-signature fees
   - **Payment**: Annual Lightning payment + per-signature fees

### Key Benefits

- **No KYC for providers** - Privacy-preserving for all parties
- **Secure tamper-evident delivery** via SeedSleeve technology
- **Lightning-native payments** - Fast, private, low-fee
- **Professional key management** - Access to expert custody services
- **Inheritance/advisor integration** - Direct shipping to financial advisors

## Technical Architecture

### 1. Seed-E API Integration Points

#### Service Discovery

```typescript
// Endpoint: GET https://seed-e.org/api/services
interface SeedEService {
  serviceId: string;
  providerName: string;
  policyType: "one_time" | "ongoing";
  fees: {
    setupFee: number; // sats
    annualFee?: number; // sats (for ongoing services)
    signingFee?: number; // sats per signature
  };
  rating: number;
  deliveryOptions: string[];
  isPurchased: boolean;
}
```

#### Authentication Flow

```typescript
// Register/Login endpoints
POST / api / clients / register;
POST / api / auth / login;
```

#### Service Purchase

```typescript
// Purchase with Lightning payment
POST / api / clients / purchase;
Response: {
  paymentRequest: string; // Lightning invoice
  paymentHash: string;
  amount: number;
}
```

#### Signature Requests (for ongoing services)

```typescript
POST / api / signature - requests / create;
{
  clientId: string;
  serviceId: string;
  psbtData: string; // base64 encoded PSBT
  paymentHash: string; // for signature fee
}
```

### 2. BTC Keeper Integration Points

#### A. Signer Type Addition

**File**: `src/services/wallets/enums/index.ts`

```typescript
export enum SignerType {
  // ... existing types
  SEED_E_MARKETPLACE = "SEED_E_MARKETPLACE",
}
```

#### B. AddSigningDevice Screen Enhancement

**File**: `src/screens/Vault/AddSigningDevice.tsx`

Add "Key Marketplace" option to signing device selection:

- New UI card for Seed-E marketplace
- Integration with existing MINISCRIPT_SIGNERS array
- Route to new marketplace screens

#### C. New Screen Flow Architecture

```
AddSigningDevice.tsx
    ↓ (User selects "Key Marketplace")
SeedEMarketplace.tsx (Service Discovery)
    ↓ (User selects service)
SeedEServiceDetails.tsx (Service details & purchase)
    ↓ (Lightning payment)
SeedELightningPayment.tsx (Payment flow)
    ↓ (Payment confirmed)
SeedEKeyConfiguration.tsx (Address/shipping details)
    ↓ (Setup complete)
SeedEServiceManager.tsx (Ongoing management)
```

## UI/UX Integration Strategy

### 1. Key Marketplace Entry Point

**Screen**: `AddSigningDevice.tsx`
**Location**: After existing hardware wallet options

```tsx
// New marketplace card
<TouchableOpacity onPress={() => navigateToMarketplace()}>
  <SignerCard
    name="Key Marketplace"
    icon={<SeedEMarketplaceIcon />}
    description="Professional key creation & custody services"
    badge="SEED-E"
  />
</TouchableOpacity>
```

### 2. Service Discovery Screen

**New Component**: `SeedEMarketplace.tsx`

Features:

- List available services with ratings
- Filter by service type (one-time vs ongoing) and pricing (highest to lowest, lowest to highest)
- Service status (not needed, services purchased should be filtered out and not visible, unless you are the person who bought it, in which you will need the ability to request a signature after going through the paywayll)

UI Elements:

- Service cards with provider info
- Price display in sats
- "Purchase" or "Manage" buttons
- Search/filter functionality

### 3. Service Details & Purchase Flow

**New Component**: `SeedEServiceDetails.tsx`

Features:

- Detailed service description
- Provider verification / communication status (link to clients Keybase account, needs to ensure that it is the keybase URL with a /username/ at the end only)
- Delivery options and timelines
- Terms and conditions
- Purchase button → Lightning payment

### 4. Lightning Payment Integration

**New Component**: `SeedELightningPayment.tsx`

Integration with existing payment infrastructure:

- Reuse existing QR code scanner (`src/screens/QRScreens/ScanQR.tsx`)
- Lightning invoice display and payment (needs to use Key Providers LNURL verifed lightning address)
- Payment confirmation handling
- Error states and retry logic

**Existing Infrastructure to Leverage**:

- `RestClient.ts` for HTTP requests
- QR scanning capabilities
- Toast messaging system
- Loading states and error handling

### 5. Configuration & Management

**New Component**: `SeedEKeyConfiguration.tsx`

Post-purchase configuration:

- Shipping address entry (secure, encrypted at rest, only the Key Provider and the Client should be able to decrypt, alias-based ideally and to a PO Box ideally)
- Third-party recipient options (advisors, inheritance planners, friends, family)
- Delivery preferences
- Privacy settings

**New Component**: `SeedEServiceManager.tsx`

Ongoing service management:

- Service status dashboard
- Signature request history (for ongoing services)
- Renewal notifications
- Provider communication
- Service termination options

## Component Architecture

### 1. Seed-E API Service Layer

**New File**: `src/services/seedE/SeedEClient.ts`

```typescript
class SeedEClient {
  private baseURL = "https://seed-e.org/api";
  private restClient = RestClient;

  async discoverServices(): Promise<SeedEService[]>;
  async authenticateUser(credentials: UserCredentials): Promise<AuthResult>;
  async purchaseService(serviceId: string): Promise<PurchaseResult>;
  async createSignatureRequest(
    request: SignatureRequest
  ): Promise<SignatureRequestResult>;
  async getServiceStatus(serviceId: string): Promise<ServiceStatus>;
}
```

### 2. Redux Integration

**New Files**:

- `src/store/reducers/seedE.ts` - State management
- `src/store/sagaActions/seedE.ts` - Action creators
- `src/store/sagas/seedE.ts` - Side effects and API calls

**State Structure**:

```typescript
interface SeedEState {
  services: SeedEService[];
  purchasedServices: PurchasedService[];
  activeSignatureRequests: SignatureRequest[];
  authToken?: string;
  isLoading: boolean;
  error?: string;
}
```

### 3. Signer Integration

**Enhanced**: `src/hardware/index.ts`

Add Seed-E marketplace signer generation:

```typescript
export const generateSeedEMarketplaceSigner = (
  serviceData: SeedEService,
  xpub: string
): Signer => {
  return {
    type: SignerType.SEED_E_MARKETPLACE,
    xpub,
    // ... standard signer properties
    serviceId: serviceData.serviceId,
    providerName: serviceData.providerName,
    policyType: serviceData.policyType,
  };
};
```

## Screen Flow Details

### 1. AddSigningDevice.tsx Enhancement

**Modifications Needed**:

- Add SEED_E_MARKETPLACE to MINISCRIPT_SIGNERS array (why - what does this mean?)
- Add new marketplace card in UI
- Handle navigation to marketplace flow

**Integration Point**:

```tsx
const MINISCRIPT_SIGNERS = [
  SignerType.MY_KEEPER,
  SignerType.TAPSIGNER,
  // ... existing signers
  SignerType.SEED_E_MARKETPLACE, // New addition
];
```

### 2. New Marketplace Screens

#### SeedEMarketplace.tsx

- **Purpose**: Service discovery and selection
- **Key Features**:
  - Service listing with filters
  - Price comparison
  - Service type selection
- **Navigation**: Routes to SeedEServiceDetails on service selection

#### SeedEServiceDetails.tsx

- **Purpose**: Service details and purchase initiation
- **Key Features**:
  - Detailed service description
  - Provider verification display
  - External profile link (Keybase)
  - Terms and conditions
  - Purchase flow initiation
- **Navigation**: Routes to Lightning payment on purchase

#### SeedELightningPayment.tsx

- **Purpose**: Lightning payment processing
- **Key Features**:
  - Lightning invoice QR code display
  - Uses key providers LNURL verified address
  - Payment status monitoring
  - Error handling and retry
- **Reuses**: Existing QR scanning and payment infrastructure
- **Navigation**: Routes to configuration on payment success

#### SeedEKeyConfiguration.tsx

- **Purpose**: Post-purchase configuration
- **Key Features**:
  - Secure address entry (alias-based)
  - Delivery option selection
  - Third-party recipient setup
- **Navigation**: Routes to service manager or back to vault

#### SeedEServiceManager.tsx

- **Purpose**: Ongoing service management
- **Key Features**:
  - Service status dashboard
  - Signature request creation (for ongoing services)
  - Provider communication
  - Service renewal/termination

## Security Considerations

### 1. Privacy Protection

- **Alias-based addressing**: No real names in API calls (ideally)
- **PO Box delivery**: Physical address protection (ideally)
- **Encrypted storage**: Sensitive data encrypted at rest, only key provider and client can decrypt
- MAYBE - optional, may add down the road: **Tor support**: Leverage existing Tor integration for API calls

### 2. Payment Security

- **Lightning-only payments**: No on-chain exposure
- **Invoice verification**: Validate payment amounts and recipients
- **Payment confirmation**: Wait for Lightning payment confirmation

### 3. Key Management

- **No xpriv exposure**: Only xpub shared with providers
- **Blinded xpub**: Providers receive encrypted xpub data
- Optional for now, we need to fix so it's done more easily down the track **Signature verification**: Validate all signatures from providers

## Lightning Payment Integration

### 1. Existing Infrastructure Leverage

BTC Keeper already has Lightning payment capabilities:

- **BTC Pay integration**: `Relay.checkEligibilityForBtcPay()`
- **QR scanning**: Existing QR scanner components
- **Payment processing**: Channel-based payment flows

### 2. Seed-E Payment Flow

```typescript
// 1. Service purchase initiation
const purchaseResponse = await SeedEClient.purchaseService(serviceId);
const { paymentRequest, paymentHash, amount } = purchaseResponse;

// 2. Display Lightning invoice QR
<QRCode value={paymentRequest} />;

// 3. Monitor payment status
const paymentStatus = await SeedEClient.checkPaymentStatus(paymentHash);

// 4. Proceed on confirmation
if (paymentStatus.confirmed) {
  navigateToConfiguration();
}
```

### 3. Signature Fee Payments (Ongoing Services)

For ongoing services requiring per-signature fees:

```typescript
// Before signature request
const signaturePayment = await SeedEClient.createSignaturePayment(serviceId);
const { paymentRequest } = signaturePayment;

// After payment confirmation
const signatureRequest = await SeedEClient.requestSignature({
  serviceId,
  psbtData: base64EncodedPSBT,
  paymentHash: signaturePayment.paymentHash,
});
```

## PSBT Signing Integration

### 1. Ongoing Service Signing Flow

For services that include signing capabilities:

**Integration Point**: `SignTransactionScreen.tsx`

Add Seed-E signing option:

```typescript
// In signTransaction callback
else if (SignerType.SEED_E_MARKETPLACE === signerType) {
  try {
    // 1. Payment for signature (if required)
    const paymentResult = await processSignaturePayment(serviceId);

    // 2. Submit PSBT to provider
    const signatureRequest = await SeedEClient.requestSignature({
      serviceId,
      psbtData: serializedPSBT,
      paymentHash: paymentResult.paymentHash
    });

    // 3. Monitor signature status
    const signedPSBT = await pollForSignature(signatureRequest.requestId);

    // 4. Update PSBT envelopes
    dispatch(updatePSBTEnvelops({ signedSerializedPSBT: signedPSBT, xfp }));

  } catch (error) {
    showToast(error.message, <ToastErrorIcon />);
  }
}
```

### 2. Signature Request Monitoring

New service for polling signature status:

```typescript
class SeedESignatureMonitor {
  async pollForSignature(requestId: string): Promise<string> {
    const maxAttempts = 30; // 5 minutes with 10s intervals

    for (let i = 0; i < maxAttempts; i++) {
      const status = await SeedEClient.getSignatureStatus(requestId);

      if (status.completed) {
        return status.signedPSBT;
      }

      if (status.failed) {
        throw new Error(status.errorMessage);
      }

      await new Promise((resolve) => setTimeout(resolve, 10000)); // 10s wait
    }

    throw new Error("Signature request timed out");
  }
}
```

## Data Models

### 1. Seed-E Service Model

```typescript
interface SeedEService {
  serviceId: string;
  providerName: string;
  providerKeybaseId: string;
  policyType: "one_time" | "ongoing";
  fees: {
    setupFee: number; // sats
    annualFee?: number; // sats
    signingFee?: number; // sats
  };
  deliveryOptions: DeliveryOption[];
  rating: number;
  reviewCount: number;
  verificationStatus: "verified" | "pending" | "unverified";
  isPurchased: boolean;
  description: string;
  termsUrl: string;
}

interface DeliveryOption {
  type: "po_box" | "advisor" | "family" | "custom";
  description: string;
  additionalFee?: number; // sats
}
```

### 2. Purchased Service Model

```typescript
interface PurchasedService {
  serviceId: string;
  purchaseDate: Date;
  status: "active" | "pending" | "expired" | "cancelled";
  deliveryStatus: "pending" | "shipped" | "delivered" | "confirmed";
  trackingInfo?: string;
  expirationDate?: Date; // for ongoing services
  signerInfo?: {
    xpub: string;
    fingerprint: string;
    derivationPath: string;
  };
}
```

### 3. Signature Request Model

```typescript
interface SignatureRequest {
  requestId: string;
  serviceId: string;
  createdAt: Date;
  status: "pending" | "processing" | "completed" | "failed" | "expired";
  psbtHash: string;
  signedPSBT?: string;
  errorMessage?: string;
  estimatedCompletionTime?: Date;
}
```

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)

- [ ] Add SEED_E_MARKETPLACE to SignerType enum
- [ ] Create SeedEClient service class
- [ ] Implement basic API integration
- [ ] Add marketplace entry point to AddSigningDevice
- [ ] Create basic service discovery screen

### Phase 2: Service Discovery & Purchase (Week 3-4)

- [ ] Complete SeedEMarketplace.tsx component
- [ ] Implement SeedEServiceDetails.tsx
- [ ] Add Lightning payment integration
- [ ] Create service purchase flow
- [ ] Add error handling and loading states

### Phase 3: Configuration & Management (Week 5-6)

- [ ] Implement SeedEKeyConfiguration.tsx
- [ ] Create secure address/shipping form
- [ ] Add SeedEServiceManager.tsx
- [ ] Implement service status tracking
- [ ] Add notification system for service updates

### Phase 4: PSBT Signing Integration (Week 7-8)

- [ ] Integrate Seed-E signing with SignTransactionScreen
- [ ] Implement signature request creation
- [ ] Add signature status monitoring
- [ ] Create signature fee payment flow
- [ ] Add signature request history

### Phase 5: Polish & Testing (Week 9-10)

- [ ] UI/UX refinements
- [ ] Error state improvements
- [ ] Performance optimization
- [ ] Security audit
- [ ] Integration testing

## Components to Reuse

### 1. Existing BTC Keeper Components

- **QRScanner**: For Lightning invoice scanning
- **RestClient**: For HTTP API calls
- **KeeperModal**: For confirmation dialogs
- **WalletHeader**: For consistent page headers
- **CustomButton**: For action buttons
- **AppActivityIndicator**: For loading states
- **Toast system**: For notifications
- **ThemedColor/ThemedSvg**: For consistent theming

### 2. Existing Patterns

- **Redux saga patterns**: For async operations
- **Navigation patterns**: CommonActions.navigate()
- **Error handling**: Toast messages and error boundaries
- **Form validation**: Input validation patterns
- **Responsive design**: hp/wp utility functions

## Risk Mitigation

### 1. Provider Trust

- **Keybase verification**: Verify provider identity
- **Rating system**: User reviews and ratings
- **Escrow consideration**: Future enhancement for payment protection

### 2. Service Availability

- **Fallback providers**: Multiple providers for resilience
- **Service monitoring**: Health checks for provider availability
- **Timeout handling**: Graceful handling of unresponsive providers

### 3. Payment Security

- **Invoice validation**: Verify payment amounts and recipients
- **Payment confirmation**: Wait for confirmations before proceeding
- **Refund mechanisms**: Handle failed service delivery

### 4. Privacy Protection

- **Data minimization**: Only collect necessary information
- **Encryption**: Encrypt sensitive data in transit and at rest
- **Audit logging**: Track access to sensitive information

## Success Metrics

### 1. Adoption Metrics

- Number of users discovering marketplace
- Service purchase conversion rate
- User retention for ongoing services
- Provider onboarding rate

### 2. Performance Metrics

- Service discovery load time
- Payment completion rate
- Signature request success rate
- Error rate and resolution time

### 3. User Experience Metrics

- User satisfaction ratings
- Service completion rate
- Support ticket volume
- Feature usage analytics

## Future Enhancements

### 1. Enhanced Privacy

- **Submarine swaps**: Additional payment privacy
- **Tor-only mode**: Enhanced network privacy
- **Zero-knowledge proofs**: For service verification

### 2. Advanced Features

- **Multi-signature coordination**: Group signature requests
- **Automated renewals**: Smart contract-based renewals
- **Insurance integration**: Service delivery insurance
- **Advanced analytics**: Service performance metrics

### 3. Provider Tools

- **Provider dashboard**: Service management interface
- **API integrations**: Direct provider API access
- **Automated workflows**: Streamlined service delivery

## Conclusion

This integration strategy provides a comprehensive roadmap for bringing Seed-E's Key Marketplace into BTC Keeper. The phased approach ensures incremental delivery while maintaining the security and user experience standards of both platforms.

The integration leverages existing BTC Keeper infrastructure while adding new capabilities that enhance the multi-signature wallet creation and management experience. By providing access to professional key management services, users gain additional security options while maintaining the self-sovereign principles that BTC Keeper embodies.

The Lightning-native payment system ensures fast, private, and low-cost transactions, while the tamper-evident SeedSleeve delivery system provides physical security for key material transport.

This integration positions BTC Keeper as a comprehensive Bitcoin custody solution that bridges the gap between self-custody and professional services, giving users the flexibility to choose the right security model for their needs.

## Final notes for BTC Keeper PR (implementation checklist)

This section is for BTC Keeper (their app), not the Seed‑E repo. Keep the integration minimal and aligned with existing patterns in BTC Keeper.

### SeedEClient wrapper (add to BTC Keeper)

Create a thin client in BTC Keeper (e.g., `src/services/seedE/SeedEClient.ts`) that centralizes all calls to Seed‑E. Make the base URL env‑driven.

```typescript
// src/services/seedE/SeedEClient.ts (BTC Keeper repo)
import RestClient from "../rest/RestClient"; // reuse existing

const SEED_E_BASE_URL = process.env.SEED_E_BASE_URL || "https://seed-e.org/api";

export class SeedEClient {
  private static async get<T>(path: string): Promise<T> {
    return RestClient.get(`${SEED_E_BASE_URL}${path}`);
  }
  private static async post<T>(path: string, body: unknown): Promise<T> {
    return RestClient.post(`${SEED_E_BASE_URL}${path}`, body);
  }

  // 1) Service discovery
  static async discoverServices(): Promise<{ services: unknown[] }> {
    return this.get(`/services`);
  }

  // 2) Auth
  static async register(
    username: string,
    password: string
  ): Promise<{ clientId: string }> {
    return this.post(`/clients/register`, { username, password });
  }
  static async login(
    username: string,
    password: string,
    userType: "client" | "provider" = "client"
  ): Promise<{
    userId: string;
    needs2FASetup?: boolean;
    needs2FAVerification?: boolean;
  }> {
    return this.post(`/auth/login`, { username, password, userType });
  }

  // 3) Purchase a service (Lightning invoice)
  static async purchaseService(
    serviceId: string,
    username: string,
    password: string
  ): Promise<{
    clientId: string;
    paymentRequest: string;
    paymentHash: string;
    amount: number;
    description: string;
    expiresAt: string;
  }> {
    return this.post(`/clients/purchase`, { serviceId, username, password });
  }

  // 4) Signature requests
  static async createSignatureRequest(params: {
    clientId: string;
    serviceId: string;
    psbtData: string; // base64
    paymentHash: string;
  }): Promise<{
    id: string;
    unlocksAt: string;
    status: string;
    message: string;
  }> {
    return this.post(`/signature-requests/create`, params);
  }

  // 5) Lists
  static async listPurchased(
    clientId: string
  ): Promise<{ purchasedServices: unknown[] }> {
    return this.get(
      `/clients/purchased-services?clientId=${encodeURIComponent(clientId)}`
    );
  }
  static async listSignatureRequests(
    clientId: string
  ): Promise<{ signatureRequests: unknown[] }> {
    return this.get(
      `/signature-requests/client?clientId=${encodeURIComponent(clientId)}`
    );
  }

  // 6) Optional: explicit payment status polling
  static async getPaymentStatus(
    paymentHash: string
  ): Promise<{ confirmed: boolean }> {
    // If/when implemented server-side; otherwise keep client polling on purchased-services
    return this.get(
      `/payments/status?paymentHash=${encodeURIComponent(paymentHash)}`
    );
  }
}
```

### Reuse existing BTC Keeper infrastructure

- **HTTP**: reuse `RestClient` and standard error handling.
- **QR**: reuse QR components for showing Lightning invoices.
- **Polling**: reuse saga/timer patterns (1s → 2s → 4s → 8s … capped) for
  - purchased services after a purchase
  - signature request status after submission

### Configuration

- Add `SEED_E_BASE_URL` to BTC Keeper env/config. Default to `https://seed-e.org/api`.
- Keep endpoints centralized in `SeedEClient`.

### Error handling

- All Seed‑E endpoints return `{ error: string }` on failure.
- Surface `error` messages from responses directly to the user (toast/snackbar), and implement retries where relevant (poll flows).
- Guard against 401/403 by prompting re‑login when needed.

### Minimal end‑to‑end flow to ship

1. Discover services → list in “Key Marketplace”.
2. Register/Login (client). Persist `clientId` in app state.
3. Purchase:
   - `purchaseService` → show QR from `paymentRequest`.
   - Poll `/clients/purchased-services?clientId=…` until service appears active.
4. Signature:
   - `createSignatureRequest({ clientId, serviceId, psbtData, paymentHash })`.
   - Poll `/signature-requests/client?clientId=…` until `signedPsbtData` is present.
   - Import signed PSBT back into BTC Keeper.

### Deferrals (can add later without blocking PR)

- Secure shipping details: collect alias only now; later add API to submit encrypted shipping payload to provider.
- Explicit `/payments/status` endpoint (optional; current polling via purchased-services is sufficient).
- 2FA UX polish if needed.
