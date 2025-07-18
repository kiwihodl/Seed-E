# Seed-E

A neutral, non-custodial directory for third-party Bitcoin signing services, designed to be integrated directly into wallets.

## Architecture Overview

Seed-E acts as a **discovery layer + payment processor** without ever touching funds. Providers maintain their own client relationships and platforms, while Seed-E handles:

- **Service Discovery**: Randomized provider listings with filtering
- **Payment Processing**: Lightning Network invoice generation and webhook handling
- **Authentication**: Username/password + TOTP 2FA for all users
- **Signature Coordination**: PSBT submission with time-delay protection

## Core Flows

### Provider Flow

1. **Register**: Username, password, and mandatory 2FA setup
2. **Prove Control**: Sign a message with the private key corresponding to their xpub
3. **List Service**: Set fees, time delays, and BOLT12 offer for payments
4. **Receive Payments**: Lightning payments flow directly to provider's node
5. **Handle Signatures**: Receive PSBT requests and sign within time windows

### Client Flow

1. **Discover**: Browse randomized provider listings with filtering options
2. **Filter & Sort**: By policy type, cost, provider age, penalty count
3. **Purchase**: Pay Lightning invoice for initial backup fee
4. **Receive xpub**: Get verified xpub for multisig setup
5. **Request Signatures**: Submit PSBTs with 7-day minimum cooling period
6. **Subscribe**: Optional recurring payments via NIP-47

### Integration Models

#### PWA (Progressive Web App)

- **Provider Dashboard**: Manage services, view signature requests
- **Client Dashboard**: View purchased services, submit signature requests
- **Authentication**: Full login and 2FA setup flows

#### Wallet Plugin

- **Service Discovery**: Browse and filter providers
- **Payment Integration**: Handle Lightning invoices
- **Signature Requests**: Submit PSBTs and track status

## Key Features

### Non-Custodial Design

- **No Fund Control**: Lightning payments flow directly client → provider
- **No Reputation System**: Avoids gamification and surveillance
- **Provider Autonomy**: Providers maintain their own client relationships

### Security Model

- **Cryptographic Proof**: Providers must prove key control upfront
- **Time-Delay System**: 7-day minimum cooling period for signature requests
- **Penalty System**: Objective metrics for provider reliability
- **2FA Required**: TOTP authentication for all accounts

### Payment Architecture

- **BOLT12 Offers**: Providers set static payment offers
- **Non-Custodial Invoices**: Generated on behalf of providers
- **Direct Payments**: Client → Provider via Lightning Network
- **Webhook Processing**: Payment confirmation triggers state changes

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Lightning Network node (LND) for payments

### Environment Setup

Create a `.env` file in the root directory:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/seed-e-db"

# Next.js Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Lightning Network Configuration (LND)
LND_REST_URL="https://your-lnd-node:8080"
LND_INVOICE_MACAROON="your-invoice-macaroon-here"
```

### Database Setup

1. **Install Dependencies:**

   ```bash
   npm install
   ```

2. **Generate Prisma Client:**

   ```bash
   npx prisma generate
   ```

3. **Push Database Schema:**
   ```bash
   npx prisma db push
   ```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## API Integration

For wallet integration and third-party platforms, see [API_ENDPOINTS.md](./API_ENDPOINTS.md) for complete endpoint documentation.

### Quick Integration Example

```javascript
// Discover Taproot services
const services = await fetch(
  "/api/services?policyType=P2TR&sortBy=penalties_asc"
);

// Purchase a service
const purchase = await fetch("/api/clients/purchase", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    username: "client123",
    password: "securepass",
    serviceId: "service_id",
  }),
});

// Handle Lightning payment
const { invoice } = await purchase.json();
// Pay invoice in wallet

// Request signature
const signatureRequest = await fetch("/api/signatures", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    username: "client123",
    password: "securepass",
    twoFactorToken: "123456",
    unsignedPsbt: "base64_psbt",
  }),
});
```

## Project Structure

```
seed-e/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   ├── dashboard/         # Client Dashboard
│   │   └── login/            # Authentication
│   └── components/            # React Components
├── prisma/                    # Database Schema
└── public/                   # Static Assets
```

## Environment Variables Explained

### Database Configuration

- **DATABASE_URL**: Your PostgreSQL connection string
  - **⚠️ IMPORTANT**: Only use ONE DATABASE_URL variable
  - Having multiple DATABASE_URL variables will cause conflicts
  - Example: `postgresql://username:password@localhost:5432/seed-e-db`

### Lightning Network Configuration

- **LND_REST_URL**: Your LND node's REST API URL
  - Example: `https://your-lnd-node:8080`
- **LND_INVOICE_MACAROON**: Your LND node's invoice macaroon
  - Used for generating Lightning invoices

### Next.js Configuration

- **NEXT_PUBLIC_APP_URL**: Your application's public URL
  - For development: `http://localhost:3000`
  - For production: Your domain URL

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
