# Seed-E API Documentation

## Overview

Seed-E provides a neutral, non-custodial directory for Bitcoin signing services. This document outlines all API endpoints for integration with wallets and third-party platforms.

## Base URL

```
https://your-seed-e-instance.com/api
```

## Authentication

Most endpoints require authentication via username/password + TOTP 2FA token. User sessions are managed via browser cookies.

## Core Endpoints

### Service Discovery

#### `GET /api/services`

**List available services for purchase**

**Response:**

```json
{
  "services": [
    {
      "id": "string",
      "providerName": "string",
      "policyType": "P2WSH" | "P2TR" | "P2SH",
      "xpubHash": "string (SHA256 hash of xpub)",
      "initialBackupFee": "number (sats)",
      "perSignatureFee": "number (sats)",
      "monthlyFee": "number (sats) | undefined",
      "minTimeDelay": "number (hours)",
      "createdAt": "ISO timestamp",
      "isPurchased": "boolean"
    }
  ]
}
```

### Client Management

#### `POST /api/clients/register`

**Register a new client account**

**Request Body:**

```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**

```json
{
  "clientId": "string",
  "message": "Client registered successfully"
}
```

#### `POST /api/clients/purchase`

**Purchase a service (creates client if doesn't exist)**

**Request Body:**

```json
{
  "serviceId": "string",
  "username": "string",
  "password": "string"
}
```

**Response:**

```json
{
  "clientId": "string",
  "paymentRequest": "lnbc...",
  "paymentHash": "string",
  "amount": "number (sats)",
  "description": "string",
  "expiresAt": "ISO timestamp"
}
```

#### `GET /api/clients/purchased-services?clientId={clientId}`

**Get client's purchased services**

**Response:**

```json
{
  "purchasedServices": [
    {
      "id": "string",
      "serviceId": "string",
      "providerName": "string",
      "policyType": "string",
      "xpubKey": "string (full xpub)",
      "masterFingerprint": "string",
      "derivationPath": "string",
      "initialBackupFee": "number",
      "perSignatureFee": "number",
      "monthlyFee": "number | undefined",
      "minTimeDelay": "number",
      "purchasedAt": "ISO timestamp",
      "expiresAt": "ISO timestamp | undefined",
      "isActive": "boolean",
      "paymentHash": "string"
    }
  ]
}
```

### Provider Management

#### `POST /api/providers/register`

**Register a new provider account**

**Request Body:**

```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**

```json
{
  "providerId": "string",
  "message": "Provider registered successfully"
}
```

#### `POST /api/providers/services`

**Create a new service listing**

**Request Body:**

```json
{
  "policyType": "P2WSH" | "P2TR" | "P2SH",
  "xpub": "string",
  "masterFingerprint": "string",
  "derivationPath": "string",
  "initialBackupFee": "number (sats)",
  "perSignatureFee": "number (sats)",
  "monthlyFee": "number (sats) | undefined",
  "minTimeDelay": "number (hours)",
  "lightningAddress": "string"
}
```

**Response:**

```json
{
  "serviceId": "string",
  "message": "Service created successfully"
}
```

#### `GET /api/providers/policies?providerId={providerId}`

**Get provider's service policies**

**Response:**

```json
{
  "policies": [
    {
      "id": "string",
      "policyType": "string",
      "xpub": "string",
      "xpubHash": "string",
      "initialBackupFee": "number",
      "perSignatureFee": "number",
      "monthlyFee": "number | undefined",
      "minTimeDelay": "number",
      "lightningAddress": "string",
      "createdAt": "ISO timestamp",
      "isPurchased": "boolean",
      "servicePurchases": [
        {
          "id": "string",
          "client": {
            "username": "string"
          },
          "createdAt": "ISO timestamp",
          "isActive": "boolean"
        }
      ]
    }
  ]
}
```

### Authentication

#### `POST /api/auth/login`

**Authenticate user (provider or client)**

**Request Body:**

```json
{
  "username": "string",
  "password": "string",
  "userType": "provider" | "client"
}
```

**Response:**

```json
{
  "needs2FASetup": "boolean",
  "needs2FAVerification": "boolean",
  "userType": "provider" | "client",
  "userId": "string"
}
```

#### `POST /api/auth/2fa/generate`

**Generate 2FA setup for user**

**Request Body:**

```json
{
  "username": "string",
  "userType": "provider" | "client"
}
```

**Response:**

```json
{
  "qrCodeDataURL": "data:image/png;base64,..."
}
```

#### `POST /api/auth/2fa/verify`

**Verify 2FA token**

**Request Body:**

```json
{
  "username": "string",
  "userType": "provider" | "client",
  "token": "string"
}
```

**Response:**

```json
{
  "verified": "boolean"
}
```

#### `POST /api/auth/validate-user`

**Validate current user session**

**Response:**

```json
{
  "username": "string",
  "userType": "provider" | "client",
  "userId": "string"
}
```

### Signature Requests

#### `POST /api/signature-requests/create`

**Create a new signature request**

**Request Body:**

```json
{
  "clientId": "string",
  "serviceId": "string",
  "psbtData": "string (base64 encoded PSBT)",
  "paymentHash": "string"
}
```

**Response:**

```json
{
  "id": "string",
  "unlocksAt": "ISO timestamp",
  "status": "PENDING",
  "message": "Signature request created successfully"
}
```

#### `GET /api/signature-requests/client?clientId={clientId}`

**Get client's signature requests**

**Response:**

```json
{
  "signatureRequests": [
    {
      "id": "string",
      "status": "PENDING" | "SIGNED" | "COMPLETED" | "EXPIRED",
      "createdAt": "ISO timestamp",
      "unlocksAt": "ISO timestamp",
      "signedAt": "ISO timestamp | undefined",
      "signatureFee": "number",
      "paymentConfirmed": "boolean",
      "providerName": "string",
      "policyType": "string",
      "psbtHash": "string | undefined",
      "signedPsbtData": "string (base64) | undefined"
    }
  ]
}
```

#### `GET /api/signature-requests/provider?providerId={providerId}`

**Get provider's signature requests**

**Response:**

```json
{
  "signatureRequests": [
    {
      "id": "string",
      "createdAt": "ISO timestamp",
      "psbtData": "string (base64)",
      "unlocksAt": "ISO timestamp",
      "clientUsername": "string",
      "servicePolicyType": "string",
      "perSignatureFee": "string",
      "status": "PENDING" | "SIGNED"
    }
  ]
}
```

#### `POST /api/signature-requests/sign`

**Submit signed PSBT**

**Request Body:**

```json
{
  "requestId": "string",
  "signedPsbtData": "string (base64 encoded signed PSBT)"
}
```

**Response:**

```json
{
  "success": "boolean",
  "message": "PSBT signed successfully"
}
```

#### `POST /api/signature-requests/validate-signed-psbt`

**Validate a signed PSBT**

**Request Body:**

```json
{
  "psbtData": "string (base64 encoded PSBT)"
}
```

**Response:**

```json
{
  "isValid": "boolean",
  "error": "string | undefined"
}
```

### Payment Processing

#### `POST /api/services/purchase`

**Create Lightning invoice for service purchase**

**Request Body:**

```json
{
  "serviceId": "string",
  "clientId": "string"
}
```

**Response:**

```json
{
  "paymentRequest": "lnbc...",
  "paymentHash": "string",
  "amount": "number (sats)",
  "description": "string",
  "expiresAt": "ISO timestamp"
}
```

#### `POST /api/services/confirm-payment`

**Confirm Lightning payment**

**Request Body:**

```json
{
  "paymentHash": "string"
}
```

**Response:**

```json
{
  "confirmed": "boolean"
}
```

#### `POST /api/webhooks/lnd`

**Lightning Network payment webhook**

**Request Body:**

```json
{
  "payment_hash": "string",
  "amount": "number",
  "status": "settled"
}
```

**Response:**

```json
{
  "processed": "boolean"
}
```

### Lightning Integration

#### `POST /api/lightning/validate-address`

**Validate Lightning address format**

**Request Body:**

```json
{
  "lightningAddress": "string"
}
```

**Response:**

```json
{
  "isValid": "boolean",
  "error": "string | undefined"
}
```

### Utility Endpoints

#### `POST /api/generate-test-data`

**Generate test data for development**

**Response:**

```json
{
  "message": "Test data generated successfully"
}
```

## Integration Examples

### Client Integration

```javascript
// Discover services
const servicesResponse = await fetch("/api/services");
const { services } = await servicesResponse.json();

// Purchase service
const purchaseResponse = await fetch("/api/clients/purchase", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    username: "client123",
    password: "securepass",
    serviceId: "service_id",
  }),
});

const { paymentRequest, paymentHash } = await purchaseResponse.json();

// Pay Lightning invoice
// Handle Lightning payment in wallet

// Create signature request
const signatureResponse = await fetch("/api/signature-requests/create", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    clientId: "client_id",
    serviceId: "service_id",
    psbtData: "base64_encoded_psbt",
    paymentHash: "signature_fee_payment_hash",
  }),
});
```

### Provider Integration

```javascript
// Register provider
const providerResponse = await fetch("/api/providers/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    username: "provider123",
    password: "securepass",
  }),
});

// Create service
const serviceResponse = await fetch("/api/providers/services", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    policyType: "P2TR",
    xpub: "xpub...",
    masterFingerprint: "12345678",
    derivationPath: "m/86'/0'/0'",
    initialBackupFee: 50000,
    perSignatureFee: 10000,
    monthlyFee: 25000,
    minTimeDelay: 168,
    lightningAddress: "provider@domain.com",
  }),
});

// Get signature requests
const requestsResponse = await fetch(
  "/api/signature-requests/provider?providerId=provider_id"
);
const { signatureRequests } = await requestsResponse.json();

// Sign PSBT
const signResponse = await fetch("/api/signature-requests/sign", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    requestId: "request_id",
    signedPsbtData: "base64_encoded_signed_psbt",
  }),
});
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:

- `400`: Bad Request (missing required fields)
- `401`: Unauthorized (invalid credentials/2FA)
- `404`: Not Found (user/service not found)
- `402`: Payment Required (subscription expired)
- `500`: Internal Server Error

## Rate Limiting

- Authentication endpoints: 5 requests per minute
- Service discovery: 100 requests per minute
- Signature requests: 10 requests per minute

## Security Notes

- All passwords are hashed using bcrypt
- 2FA tokens are time-based (TOTP)
- PSBTs are encrypted at rest
- Lightning payments are non-custodial
- No sensitive data is logged
- xpub data is hashed for service listings
- Full xpub only provided after purchase confirmation
