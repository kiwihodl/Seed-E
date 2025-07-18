# Seed-E

A neutral, non-custodial directory for third-party Bitcoin signing services, designed to be integrated directly into wallets.

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Lightning Network node (LND) for payments

### Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```bash
# Database Configuration
# IMPORTANT: Use only ONE DATABASE_URL - having multiple will cause conflicts
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

## Features

- **Provider Registration**: Sign up as a signing service provider
- **Client Dashboard**: Purchase and manage signing services
- **2FA Authentication**: Time-based One-Time Password (TOTP)
- **Lightning Payments**: Non-custodial payment processing
- **Signature Requests**: Submit and manage PSBT signing requests
- **Time-Delay System**: Mitigate wrench attacks with configurable delays

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
