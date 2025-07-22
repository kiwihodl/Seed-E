# Seed-E API Documentation

## Overview

Seed-E provides a neutral, non-custodial directory for Bitcoin signing services. This document outlines all API endpoints for integration with wallets and third-party platforms.

## Base URL

```
https://your-seed-e-instance.com/api
```

## Authentication

Most endpoints require authentication via username/password + TOTP 2FA token.

## Core Endpoints

### Provider Management

#### `POST /api/providers`

**Register a new provider and create their first service**

**Request Body:**

```json
{
  "username": "string",
  "password": "string",
  "name": "string",
  "policyType": "P2WSH" | "P2TR" | "P2SH",
  "xpub": "string",
  "controlSignature": "string",
  "initialBackupFee": "number (sats)",
  "perSignatureFee": "number (sats)",
  "monthlyFee": "number (sats) | null",
  "annualFee": "number (sats) | null",
  "minTimeDelay": "number (hours)",
  "bolt12Offer": "string"
}
```

**Response:**

```json
{
  "providerId": "string",
  "serviceId": "string",
  "message": "Provider registered successfully"
}
```

### Client Management

#### `POST /api/clients/purchase`

**Register a client and purchase a service**

**Request Body:**

```json
{
  "username": "string",
  "password": "string",
  "serviceId": "string"
}
```

**Response:**

```json
{
  "clientId": "string",
  "invoice": "lnbc...",
  "paymentHash": "string",
  "expiresAt": "ISO timestamp"
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
  "userType": "provider" | "client"
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

### Service Discovery

#### `GET /api/services`

**List available services with filtering**

**Query Parameters:**

- `policyType`: `P2WSH` | `P2TR` | `P2SH`
- `maxInitialBackupFee`: `number`
- `maxPerSignatureFee`: `number`
- `maxMonthlyFee`: `number`
- `sortBy`: `penalties_asc` | `delay_desc` | `null` (random)

**Response:**

```json
[
  {
    "id": "string",
    "policyType": "P2WSH" | "P2TR" | "P2SH",
    "xpub": "string",
    "initialBackupFee": "number",
    "perSignatureFee": "number",
    "monthlyFee": "number | null",
    "annualFee": "number | null",
    "minTimeDelay": "number",
    "provider": {
      "username": "string",
      "createdAt": "ISO timestamp"
    }
  }
]
```

### Signature Requests

#### `POST /api/signatures`

**Submit a signature request**

**Request Body:**

```json
{
  "username": "string",
  "password": "string",
  "twoFactorToken": "string",
  "psbtData": "string"
}
```

**Response:**

```json
{
  "id": "string",
  "unlocksAt": "ISO timestamp",
  "message": "Signature request created successfully"
}
```

### Payment Processing

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

## Integration Examples

### Wallet Plugin Integration

```javascript
// Discover services
const services = await fetch(
  "/api/services?policyType=P2TR&sortBy=penalties_asc"
);

// Purchase service
const purchase = await fetch("/api/clients/purchase", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    username: "client123",
    password: "securepass",
    serviceId: "service_id",
  }),
});

// Pay Lightning invoice
const { invoice } = await purchase.json();
// Handle Lightning payment in wallet

// Request signature
const signatureRequest = await fetch("/api/signatures", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    username: "client123",
    password: "securepass",
    twoFactorToken: "123456",
    psbtData: "base64_psbt",
  }),
});
```

### Provider Integration

```javascript
// Register provider
const provider = await fetch("/api/providers", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    username: "provider123",
    password: "securepass",
    name: "BitcoinSigningService",
    policyType: "P2TR",
    xpub: "xpub...",
    controlSignature: "signature...",
    initialBackupFee: 50000,
    perSignatureFee: 10000,
    monthlyFee: 25000,
    minTimeDelay: 168,
    bolt12Offer: "lno...",
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
