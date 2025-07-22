# Signature Request Feature Specification

## Overview

Add signature request functionality to allow clients to request PSBT signatures from providers.

## Database Schema Updates

### SignatureRequest Table Updates

```sql
ALTER TABLE "SignatureRequest" ADD COLUMN "psbtData" TEXT NOT NULL;
ALTER TABLE "SignatureRequest" ADD COLUMN "signedPsbtData" TEXT;
ALTER TABLE "SignatureRequest" ADD COLUMN "psbtHash" VARCHAR(64);
ALTER TABLE "SignatureRequest" ADD COLUMN "paymentHash" VARCHAR(64);
ALTER TABLE "SignatureRequest" ADD COLUMN "paymentConfirmed" BOOLEAN DEFAULT FALSE;
ALTER TABLE "SignatureRequest" ADD COLUMN "signatureFee" INTEGER NOT NULL;
```

## Implementation Flow

### 1. Client Side - Request Creation

- **Button**: "Request Signature" under "Your Signature Requests (0)"
- **Payment First**: Pay signature fee before any PSBT processing (anti-spam)
- **Key Selection**: Show purchased keys, let user select one
- **PSBT Upload**: Allow PSBT file upload with validation
- **PSBT Validation**: Check it has no signatures yet (absolute strict)
- **Request Submission**: Create signature request in database

### 2. PSBT Storage Strategy

- **Database storage** (recommended)
- **Base64 encoding** for PSBT transfer
- **Encrypted storage** in database
- **Size limits**: Reasonable constraints (< 1MB typical)

### 3. PSBT Validation Requirements

- **Zero signatures allowed** - PSBT must be completely unsigned
- **Format validation** - Must be valid PSBT format
- **Size limits** - Reasonable size constraints
- **Input validation** - Check for valid Bitcoin inputs

### 4. Provider Response Flow

- **Provider dashboard** - Show pending signature requests
- **Sign PSBT** - Provider signs in their interface
- **Auto-notification** - System notifies client via existing UI
- **Status update** - Request status changes from "PENDING" → "SIGNED"
- **Download signed PSBT** - Client can download from their dashboard

## Status Flow

1. **REQUESTED** - Client has paid and submitted PSBT
2. **PENDING** - Provider has received request
3. **SIGNED** - Provider has signed PSBT
4. **COMPLETED** - Client has downloaded signed PSBT

## Testing Requirements

- **Temporarily disable 7-day minimum** for testing
- **Create test PSBTs** for validation
- **Add provider signing simulation**

## API Endpoints Needed

- `POST /api/signature-requests/create` - Create signature request
- `GET /api/signature-requests/client` - Get client's requests
- `GET /api/signature-requests/provider` - Get provider's pending requests
- `POST /api/signature-requests/sign` - Provider signs PSBT
- `GET /api/signature-requests/download/:id` - Download signed PSBT

## Security Considerations

- **Payment verification** - Prevent spam/DDoS
- **PSBT validation** - Ensure only unsigned PSBTs
- **Encrypted storage** - Secure PSBT storage in database
- **Access control** - Verify client owns the service

## Bitcoin Keeper Reference

- **Import/Export**: Base64 encoding for PSBT transfer
- **Validation**: Strict format checking
- **UI**: Clean file upload/download interface
- **Security**: Proper validation before processing

## Implementation Order

1. **Database migration** - Add new columns
2. **Payment wall** - Reuse existing payment system
3. **Client UI** - Add request button and flow
4. **PSBT handling** - Upload, validation, storage
5. **Provider UI** - Add request queue and signing
6. **Testing** - Disable time delays temporarily
7. **Polish** - Notifications and status updates

## Notes

- Reuse existing Lightning payment system
- Use existing UI components and styling
- Follow Bitcoin Keeper patterns for PSBT handling
- Implement strict validation to prevent issues

## ✅ Completed

- Database schema updated with new SignatureRequest fields
- Client dashboard has "Request Signature" button
- SignatureRequestModal component created with 3-step flow:
  - Step 1: Payment wall (100 sats fee)
  - Step 2: Service selection (from purchased services)
  - Step 3: PSBT upload with validation
- Reuses existing PaymentModal for fee collection
- File upload with size and type validation
- Step indicator UI showing progress
- **API endpoints created:**
  - `POST /api/signature-requests/create` - Create signature request
  - `GET /api/signature-requests/client` - Get client's requests
  - `GET /api/signature-requests/provider` - Get provider's pending requests
  - `POST /api/signature-requests/sign` - Provider signs PSBT
  - `GET /api/signature-requests/download/:id` - Download signed PSBT
- **Provider dashboard updated** to use new API endpoints
- **PSBT validation** implemented (basic format checking)
- **7-day minimum temporarily disabled** for testing
- **Test PSBT generator** created for easy testing

## 🔄 In Progress

- Payment integration for signature fees (needs special handling)
- Real PSBT validation (currently basic format checking)

## ⏳ Next Steps

- Test the complete flow end-to-end
- Add proper PSBT parsing and signature validation
- Implement payment integration for signature fees
- Add status updates and notifications
- Re-enable time delays for production
