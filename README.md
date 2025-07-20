# Seed-E

A non-custodial directory for third-party Bitcoin signing services, designed to be integrated directly into wallets or self hosted as your own instance.

---

## The Problem (Why Seed-E is Needed)

Setting up a robust multisignature wallet often involves a difficult choice for where your keys are located. Finding a trustworthy and technically compatible third-party signing service, in a different geographical location, to mitigate wrenches and 6102 attempts, is a major hurdle. Clients are left to navigate a fragmented landscape of trust based on social media presence for individuals, or KYC with companies where these centralized institutions reintroduce a 6102 attack vector, while needing your XPub which means they track and know all of your corresponding balances and transactions. There is no standardized way to engage for verify non-kyc backup key services, until now.

This creates a significant barrier to entry for clientss wanting to improve their security with a `m-of-n` setup that can include a reliable, professional and reputable third-party (subjective).

## The Solution (What Seed-E Is)

Seed-E is an **unopinionated directory**, not a ratings agency. It acts as a plugin for wallets or can be used as a standablone self-hosted service, providing a simple, secure, and neutral platform for clients to find and engage with third-party signing service providers. It is the clients responsibility to gauge the trust-worthiness of provider, who is the back up key and signer. Any way of measuring trust and reputation by Seed-E (beyond the providers creation date) can be gamified or leads to spying, which we refuse to engage in any way.

Our core mission is to facilitate a connection by verifying one thing and one thing only: **that the provider has cryptographic control of the key they offer**. We do not rank, rate, or recommend beyond tenure which is an optional filter for the client. We provide objective data and a secure transaction layer, empowering the client to make their own decision.

### Core Principles

- **Absolutely Non-Custodial:** We never touch clients or providers funds. All payments are peer-to-peer over the Lightning Network using Bolt12.
- **Privacy:** Both providers and clients get a master key, there is no emails, no KYC and all xpubs / zpubs shared are hashed and stored in the DB to minimize key reuse. Even if the DB was breached, all that they would see is usernames and hashes. Have fun with your Bitcoin!
- **Platform Neutrality:** The default provider list is randomized on every load. We do not play favorites. There is no "top spot" to pay for.
- **Sovereignty:** The client is in control. They filter the list based on objective, verifiable data (cost, key type, providers tenure) and make their own informed choice.
- **Minimalist Trust:** We verify the provider's key control upfront. After that, the trust relationship is between the client and the provider, where it belongs.
- **Robust Lifecycle Management:** The platform includes automated warnings and clear processes for handling overdue subscription payments, ensuring fairness for both clients and providers.

---

## 🚀 Features

### **Real Bitcoin Integration**

- ✅ **Cryptographic Key Validation**: Real BIP32 xpub validation
- ✅ **ECDSA Signature Verification**: 64-byte signature validation
- ✅ **Fresh Key Generation**: Unique Bitcoin keys generated on demand
- ✅ **Hashed xpub Storage**: xpubs never stored in plain text for security
- ✅ **BOLT12 Lightning Offers**: Real Lightning Network payment integration

### **Provider Management**

- ✅ **Service Configuration**: Add signing keys with real Bitcoin validation
- ✅ **Pricing Setup**: Configure backup fees, signature fees, and monthly fees
- ✅ **Time Delays**: Set custom time delays for signature releases
- ✅ **Interactive Dashboard**: Click key cards to view full details
- ✅ **Real-time Validation**: Form validation with comprehensive error handling

### **Authentication & Security**

- ✅ **2FA Implementation**: TOTP-based two-factor authentication
- ✅ **Secure Password Handling**: Encrypted password storage
- ✅ **Recovery Key System**: Backup authentication methods
- ✅ **Session Management**: Persistent user sessions

### **User Experience**

- ✅ **Dark/Light Mode**: Persistent theme support across all pages
- ✅ **Responsive Design**: Mobile-friendly interface
- ✅ **Real-time Feedback**: Comprehensive validation and error messages
- ✅ **Interactive Elements**: Clickable cards, modals, and visual indicators

### **Service Purchase System**

- ✅ **Lightning Network Integration**: Payment processing with Lightning invoices
- ✅ **Purchase Flow**: One-click service purchase with confirmation
- ✅ **Global Purchase Tracking**: Once purchased, no one else can buy the same key
- ✅ **Purchase Status**: Clear visual indicators for available vs purchased services
- ✅ **Secure Key Handling**: Only hashed xpubs stored in database
- ✅ **Marketplace Security**: Purchased services disappear from public marketplace
- ✅ **User-Specific Views**: Providers see all their services, clients see available + purchased

## 🔧 API Endpoints

### Authentication

- `POST /api/auth/login` - User authentication
- `POST /api/auth/2fa/generate` - 2FA setup
- `POST /api/auth/2fa/verify` - 2FA verification
- `POST /api/auth/generate-recovery-key` - Recovery key generation

### Provider Management

- `GET /api/providers/policies` - List provider services
- `POST /api/providers/policies` - Create new service
- `GET /api/providers/signature-requests` - List pending requests
- `POST /api/providers/signature-requests` - Submit signed PSBT

### Client Services

- `GET /api/services` - List available services
- `POST /api/services/purchase` - Purchase a service
- `GET /api/clients/purchased-services` - List client's purchased services

### Test Data Generation

- `GET /api/generate-test-data` - Generate fresh Bitcoin keys and signatures

> **🚨 Production Requirement**: Current implementation uses mock Lightning invoices with "pending payment" status. For production, Lightning payments must be atomic - either payment succeeds and key is immediately purchased, or payment fails and key remains available. No "pending payment" state should exist in production.

## 🔒 **Critical Security Information**

### **Hashed xpub Storage**

**No database contains plain text xpubs.** All extended public keys are hashed using HMAC-SHA256 with a server secret before storage. Even if the database is compromised, the actual xpubs remain secure. Only hashed values are stored and transmitted.

**⚠️ Ecosystem Limitation**: The hashed xpub system only prevents key reuse **within our platform's ecosystem**. Providers could still use the same xpub in other services outside our platform. Clients must trust that providers are not reusing keys elsewhere. We can only enforce good key management within our ecosystem - the broader Bitcoin ecosystem requires trust and reputation.

### **Master Key Requirements**

**This platform is NOT for users who cannot handle basic key backup.** Both clients and providers must securely backup their master keys. If you cannot properly backup a simple master key, you are in the wrong business and should use an ETF or custodial backup service instead.

**Requirements:**

- **Providers**: Must securely store their signing keys and master keys
- **Clients**: Must backup their master keys for assisted wallet recovery, to prove they bought this service from the provider
- **No Custodial Service**: This is a non-custodial platform - you control your keys
- **Self-Service**: Users are responsible for their own key management, there is no customer support

**If you cannot meet these basic requirements, this platform is not for you. You may be better suited for fiat or custodial solutions**

## 🛠 Technical Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, Prisma ORM
- **Database**: PostgreSQL with Docker
- **Bitcoin**: bitcoinjs-lib, bip32, tiny-secp256k1
- **Authentication**: TOTP 2FA with speakeasy
- **Payments**: Lightning Network (BOLT12)
- **Security**: HMAC-SHA256 hashing for xpub storage

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- PostgreSQL

### Environment Variables

Create a `.env` file with the following variables:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5433/seed-e-db"

# Security (REQUIRED - Keep this private and unique to your deployment)
XPUB_HASH_SECRET="your-strong-secret-key-here"

# Optional: Production database
POSTGRES_PRISMA_URL="your-production-database-url"
POSTGRES_URL_NON_POOLING="your-production-direct-url"
```

**⚠️ Critical Security Notes:**

- The `XPUB_HASH_SECRET` is required for secure xpub hashing
- **Keep this secret private and unique to your deployment**
- **Never commit this to version control**
- **Don't share this secret between different deployments**
- **Once set, don't change it** - changing it will break verification of existing hashed xpubs - I can not overstate how detrimental this will be to your clients and providers.
- Each deployment should have its own unique secret for maximum security isolation

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd seed-e
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your database and API keys
   # REQUIRED: XPUB_HASH_SECRET for secure xpub hashing
   ```

4. **Start the database**

   ```bash
   docker-compose up -d
   ```

5. **Run database migrations**

   ```bash
   npx prisma db push
   ```

6. **Start the development server**

   ```bash
   npm run dev
   ```

7. **Open your browser**
   ```
   http://localhost:3000
   ```

## 🎯 Current Status

### ✅ **Completed Features**

- Real Bitcoin key validation and generation
- Cryptographic signature verification
- Interactive provider dashboard
- **Client registration with real-time validation**
- **Client dashboard with service browsing**
- **Cross-user-type username uniqueness**
- **Enhanced form validation and UX**
- Comprehensive form validation
- Dark/light mode support
- Database integration with Prisma

### 🔄 **In Development**

- **Service purchase flow with Lightning payments**
- **Signature request system with PSBT validation**
- Key derivation and management
- Service discovery protocol
- Advanced Lightning Network integration

### ⏳ **Planned Features**

- **Provider reputation and penalty systems**
- **Advanced PSBT validation and verification**
- Automated signature processing
- Advanced analytics and monitoring
- Multi-provider support
- Mobile application

#### **Structured Provider Information (Phase 2)**

- **Security Practices**: Standardized security methodology descriptions
- **Key Storage Method**: How keys are stored (hardware, air-gapped, etc.)
- **Key Generation Method**: How keys are generated (hardware wallet, manual, etc.)
- **Signing Device**: Type of device used for signing (cold storage, hardware wallet, etc.)
- **Location**: Optional geographic location for regulatory compliance
- **No Custom URLs**: Eliminates attack vectors from malicious links
- **Per-Key Information**: Each service/key has its own structured data
- **Searchable & Filterable**: Standardized format for easy discovery

## 🔒 Security Features

- **Real Cryptographic Validation**: All Bitcoin keys and signatures are cryptographically verified
- **Hashed xpub Storage**: xpubs never stored in plain text, only HMAC-SHA256 hashes
- **Global Purchase Tracking**: Once a key is purchased, no one else can buy it
- **Time-based Security**: Configurable delays for signature releases
- **2FA Protection**: Two-factor authentication for all accounts
- **Secure Storage**: Encrypted sensitive data storage
- **No Malicious URL Attack Vectors**: Structured data only, no custom URLs

## 🎨 UI/UX Features

- **Persistent Themes**: Dark/light mode with localStorage persistence
- **Interactive Elements**: Clickable cards, modals, and visual feedback
- **Real-time Validation**: Form validation with immediate feedback
- **Responsive Design**: Mobile-friendly interface
- **Accessibility**: Proper contrast ratios and keyboard navigation

---

## The Client Flow

1.  **Discover:** Inside their wallet's multisig setup if they have the plugin, or in our PWA (progressive web app), the client selects from the keys available.
2.  **Filter & Sort:** The client is shown a **randomized** list of providers. They can filter the list and also apply a sort order:
    - **Filters:** Key Policy Type, Cost (Backup, Signature, or Subscripton - Monthly / Annualy), Provider Since (registration date).
    - **Sort Options:** Default (Random), Fewest Penalties, Longest Time Delay.
3.  **Pay:** The client selects a provider and is presented with a Lightning invoice. They pay the initial backup fee. This grants them access for a set period (e.g., 30 days or forever but with a higher signing fee and / or intial fee).
4.  **Receive:** Upon successful payment, the provider's verified `xpub` is immediately delivered to the clients dashboard for inclusion in their multisig configuration.
5.  **Subscribe (Optional):** If the provider requires a monthly fee, the client can authorize a recurring payment via Nostr Wallet Connect (NIP-47) to maintain access.
6.  **Request Signature:** When a signature is needed, the client authenticates and submits their PSBT without signing it first. The platform records the submission time and calculates the `unlocksAt` date based on the provider's specified delay forementioned in the purchase details.
7.  **Receive Signed PSBT:** After the time delay has passed, the signed PSBT is made available to the client.
8.  **Backup Credentials:** Clients will have access to a secure settings page where, after re-authenticating with 2FA, they can view their credentials and export them to a local file, with strong recommendations to use a password manager.

## The Provider Flow

1.  **Register & Secure Account:** A provider signs up with a username and password and is required to set up Time-based One-Time Password (TOTP) 2FA for account security.
2.  **Define Service:** They create a service listing, providing:
    - The `xpub` of the key they will use.
    - The key's policy type.
    - **Time-Delay Options:** The provider must set a minimum time delay (default 7 days) before a signed PSBT is returned to the client.
    - Fees: Initial backup, per-signature, and an optional monthly subscription fee.
    - A **BOLT12 Offer** (`lno...`) for receiving payments.
3.  **Prove Control:** To be listed, the provider must sign a message with the private key corresponding to the `xpub` they provided. Our backend verifies this signature.
4.  **Handle Requests:** When a client requests a signature, the provider receives a notification. They must upload the signed PSBT before the signing window expires to avoid a penalty.

---

## Time-Delay & Penalty System

To mitigate wrench attacks and provide a transparent measure of provider reliability, Seed-E implements a time-delay and penalty system.

- **Provider-Set Delays:** Providers must set a minimum time-delay (in days) for returning a signed PSBT. This helps protect their clients from being coerced into signing under duress.
- **Signing Window:** Once a signature is requested and the time-delay period begins, the provider has a fixed window (e.g., time-delay + 7 days) to upload the signed PSBT.
- **Penalties:** If a provider fails to upload the signed PSBT within this window, their public `penaltyCount` is incremented.
- **Objective Sorting:** This `penaltyCount` serves as a crucial, non-gameable metric. While Seed-E remains neutral and defaults to a random sort, clientss can choose to sort providers by "Fewest Penalties," placing the most reliable and responsive providers at the top, while clients can create a new username, this is recorded and the person can still damage the providers reputation socially.

## Subscription & Dunning Lifecycle

To ensure fairness and transparency, Seed-E automates the handling of subscription payments.

1.  **Grace Period:** If a client's monthly payment is missed, a 5-week grace period begins.
2.  **Weekly Warnings:** During the grace period, the client receives a weekly notification warning them of the overdue payment.
3.  **Deletion Warning:** After the second month of non-payment, the warning changes to inform the client that the key is at risk of being deleted by the provider in one month. A countdown is provided with each weekly notification.
4.  **Provider Action (After 3 Months):** After three months of non-payment, the provider has two options on their dashboard:
    - **Delete the Key:** The provider can choose to delete the key. A final, verifiable notification is sent to both the provider and the client confirming this action. The client's outstanding balance is cleared.
    - **Retain the Key:** The provider can choose to hold onto the key. The outstanding balance continues to accrue. The client will be required to pay the full back-charged amount before they can request any future signatures.

---

## Technical Deep Dive

This section is for those interested in the underlying architecture.

The entire payment architecture is designed to be non-custodial, with our service acting as a "proof-of-payment oracle."

- **BOLT12 is Key:** Providers give us a static BOLT12 Offer, not a one-time invoice. This offer contains their node's identity and payment parameters.
- **Non-Custodial Invoice Generation:** When a client wants to pay, our backend does **not** generate an invoice for its own node. Instead, it uses the provider's BOLT12 offer to request a unique, payable invoice _on behalf of the provider_. The destination in the resulting `lnbc...` invoice is the provider's node.
- **Proof of Payment:** The payment flows directly from the client to the provider. Our backend node receives the `invoice_settled` webhook from its node software (e.g., LND, Core Lightning) the instant the payment succeeds. This is our verifiable trigger for all state changes, whether it's releasing an `xpub`, authorizing a signature request, or extending a monthly subscription.
- **Node Infrastructure:** This requires a dedicated, always-on backend Lightning node. A service like **Voltage**, API-controllable node that can handle the programmatic invoice requests and webhook listeners will be required, for testing we are using a newly spun up node. It can also be configured to request recurring payments using standards like Nostr Wallet Connect (NIP-47), this will start with my spare node, to iterate quickly and get it ready for production.

The security model is focused on cryptographic proof and minimizing the platform's role.

- **Upfront Key Verification:** A provider's service is not listed until they sign a challenge string with the private key for the `xpub` they are offering. We verify this `(message, xpub, signature)` tuple to cryptographically prove control. This is the foundation of the platform's integrity.
- **PSBT Handling:** When a client needs a signature, they submit an unsigned PSBT to our backend after paying the providers fee (or if their subscription is active). We pass this to the provider. The provider signs it and submits the signed PSBT back. The platform simply acts as a secure data conduit for the PSBT.
- **Client Authentication:** For signing requests (after the initial backup), clients authenticate using a username, a strong hashed password, and a TOTP-based 2FA code. This provides strong security for initiating sensitive operations like signature requests.

The project is designed as a modern, monolithic web application for simplicity and rapid development.

- **Tech Stack:** A **Next.js** application written in **TypeScript** and styled with **Tailwind CSS**.
- **Progressive Web App (PWA):** The provider-facing part of the app is a PWA. This allows providers to "install" the dashboard on their phone or desktop, giving it an app-like feel and enabling push notifications without the complexity of native app development or app stores.
- **API & Frontend in One:** Next.js API Routes will serve the wallet plugin's requests and the frontend dashboard's data needs. The frontend itself will be built in React.
- **Notifications:** We will use the standard **Web Push API** to send real-time notifications to the provider's PWA when a signature request is pending.
- **Database:** A standard PostgreSQL database to store provider data, service listings, client IDs (with hashed passwords), and payment states.

---

## 🔧 Development & Testing

### Complete Environment Variables Reference

For Lightning Network integration and full functionality, you need these additional environment variables:

```bash
# Database Configuration
DATABASE_URL="postgresql://seed-e-user:seed-e-password@localhost:5433/seed-e-db"

# Lightning Network (LND) Configuration
LND_REST_URL="http://your-lnd-rest-url:8080"
LND_INVOICE_MACAROON="your-lnd-invoice-macaroon-here"

# Security
XPUB_HASH_SECRET="your-random-secret-for-hashing-xpubs"

# Next.js (Optional)
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### Environment Variables Reference

| Variable               | Required | Description                  | Example                                    |
| ---------------------- | -------- | ---------------------------- | ------------------------------------------ |
| `DATABASE_URL`         | ✅       | PostgreSQL connection string | `postgresql://user:pass@localhost:5433/db` |
| `LND_REST_URL`         | ✅       | LND REST API endpoint        | `http://localhost:8080`                    |
| `LND_INVOICE_MACAROON` | ✅       | LND invoice macaroon (hex)   | `..................`                       |
| `XPUB_HASH_SECRET`     | ✅       | Secret for hashing xpubs     | `your-random-secret-string`                |
| `NEXTAUTH_SECRET`      | ❌       | NextAuth.js secret           | `your-secret-here`                         |
| `NEXTAUTH_URL`         | ❌       | NextAuth.js URL              | `http://localhost:3000`                    |

### Testing Utilities

The project includes several test scripts for different purposes:

#### Test Files Overview

| File                        | Purpose                                 | Usage                                                                           |
| --------------------------- | --------------------------------------- | ------------------------------------------------------------------------------- |
| `working-lightning-test.js` | **Complete Lightning Integration Test** | Tests the full flow: provider → service → client → purchase → Lightning invoice |
| `generate-real-keys.js`     | **Generate Real Bitcoin Keys**          | Creates real xpubs, signatures, and BOLT12 offers for testing                   |
| `create-test-provider.js`   | **Create Test Provider**                | Creates a test provider in the database                                         |
| `test-lightning.js`         | **Lightning Service Test**              | Tests Lightning invoice creation directly                                       |
| `test-purchase-api.js`      | **Purchase API Test**                   | Tests the purchase API endpoint                                                 |
| `test-lightning-simple.js`  | **Environment Check**                   | Verifies LND environment variables are set                                      |
| `simple-lightning-test.js`  | **Simple Lightning Test**               | Basic Lightning invoice creation test                                           |
| `manual-lightning-test.md`  | **Manual Test Guide**                   | Step-by-step manual testing instructions                                        |

#### Running Tests

##### 1. Complete Lightning Integration Test

```bash
node working-lightning-test.js
```

**What it does:**

- **Generates fresh real Bitcoin keys** each time using `generate-real-keys.js`
- Creates a test provider with unique name
- Creates a **new service** with 1 sat fees using fresh real Bitcoin keys
- Creates a test client
- Initiates a purchase and generates a **real Lightning invoice**
- Tests the complete flow from provider creation to Lightning payment
- **Each test run creates completely fresh data** - no reused services or keys

**Test Flow:**

1. **Key Generation**: Runs `generate-real-keys.js` to create fresh xpub, signature, and BOLT12 offer
2. **Provider Creation**: Creates a unique test provider with timestamp-based name
3. **Service Creation**: Creates a new service with the fresh keys and 1 sat fees
4. **Client Creation**: Creates a unique test client
5. **Purchase Initiation**: Purchases the service and generates a Lightning invoice
6. **Invoice Details**: Displays payment request, amount, description, and expiration

**Note:** This test uses real Lightning Network integration. Each run creates unique providers, services, and clients to avoid conflicts. The Lightning invoice is generated with a 15-minute expiration time.

##### 2. Generate Real Bitcoin Keys

```bash
node generate-real-keys.js
```

**What it does:**

- Generates a real BIP32 master key
- Creates a valid xpub (extended public key)
- Signs a message with the private key
- Generates a BOLT12 offer
- Outputs all values needed for service creation

##### 3. Environment Check

```bash
node test-lightning-simple.js
```

**What it does:**

- Verifies LND environment variables are set
- Checks if Lightning configuration is complete
- Provides clear error messages for missing variables

##### 4. Manual Testing

Follow the instructions in `manual-lightning-test.md` for step-by-step manual testing using curl commands.

#### Test Data Requirements

For Lightning integration tests, you need:

- **LND Node**: Running and accessible
- **Invoice Macaroon**: With invoice permissions
- **Database**: PostgreSQL running with schema applied
- **Environment Variables**: All required variables set in `.env`

#### Cleanup Recommendation

You can safely remove these duplicate test files:

```bash
rm test-lightning-integration.js
rm simple-lightning-test.js
rm test-lightning.js
rm test-purchase-api.js
rm create-test-provider.js
```

Keep these essential test files:

- `working-lightning-test.js` - **Main test** that creates provider → service → client → Lightning invoice
- `generate-real-keys.js` - **Utility** to generate real Bitcoin keys for testing
- `test-lightning-simple.js` - **Environment check** to verify LND variables are set
- `manual-lightning-test.md` - **Manual guide** for step-by-step testing
