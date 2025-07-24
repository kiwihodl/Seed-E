# Seed-E: P2P Collaborative Bitcoin Custody Platform

Seed-E is a non-custodial directory for Bitcoin signing services that enables collaborative custody through a marketplace of trusted providers.

## ⚠️ CRITICAL DISCLAIMER

**YOU CAN AND PROBABLY WILL LOSE FUNDS IF YOU USE THIS SOFTWARE**

This is experimental software in early development. **DO NOT USE** for significant amounts until Beta testing is complete. The current implementation has serious privacy limitations:

- **Provider Snooping**: Providers can see ALL your transaction history and balances by scanning the blockchain with their pubkey
- **No Privacy Protection**: Your financial activity is completely visible to providers
- **Extortion Risk**: Larger balances increase risk of extortion attempts
- **Trust Required**: You must absolutely trust your chosen provider

**Only use providers you completely trust and start with small amounts for testing.**

## 🚀 Features

- **Dark mode**: First things first
- **Provider Marketplace**: Browse and purchase signing services from verified providers (keybase)
- **Lightning Payments**: Instant payments using Lightning Network to purchase services
- **PSBT Support**: Full Partially Signed Bitcoin Transaction workflow
- **Signature Requests**: Request signatures from providers with payment-first approach
- **Real-time Status**: Track signature request status and payment confirmations
- **2FA Security**: Multi-factor authentication for all users
- **Provider Dashboard**: Manage services and handle signature requests

## 🔒 Privacy & Security Considerations

### Current Privacy Limitations

**Important**: The current implementation uses traditional `xpub` / `zpub` - based multisig setups, which have known privacy limitations:

1. **Provider Snooping**: Providers can monitor the blockchain for any transaction using their `xpub` and see the entire multisig wallet's transaction history, even for transactions they didn't participate in.

2. **Platform Trust**: Users must trust that Seed-E doesn't log or misuse the `xpub` data submitted by providers. This will be provable before Beta closes.

3. **Limited Extortion Protection**: The time delay provides some protection but doesn't prevent extortion attempts.

### Privacy Roadmap

We are committed to implementing advanced privacy solutions:

#### Phase 1: MVP (Current)

- ✅ Create and recover provider and client accounts
- ✅ Currently encrypts: - Passwords: Hashed with bcrypt (secure) - XPUB_HASH_SECRET: Environment variable (encrypted at rest) - NEXTAUTH_SECRET: Environment variable (encrypted at rest) - Database connections: Environment variables
  ❌ Currently NOT Encrypted (Privacy Issues): - Usernames: Plain text in database - XPUBs/ZPUBs: Plain text in database (major privacy issue) - Transaction history: Visible to providers - Purchase history: Plain text - Signature requests: Plain text PSBT data - Client balances: Visible via xpub analysis - Provider service details: Plain text
- ✅ Provider xpub/zpub import from Seed Signer
- ✅ List xpub for sale with paywall protection
- ✅ Purchase xpub and request signatures
- ✅ Provider signing with time delay
- ✅ Client PSBT download functionality

#### Phase 1.5: Immediate Encryption (High Priority)

- 🔄 **Encrypt XPUBs/ZPUBs** in database with AES-256
- 🔄 **Encrypt PSBT data** in signature requests
- 🔄 **Encrypt purchase history** details
- 🔄 **Add field-level encryption** for sensitive data
- 🔄 **Client-side encryption** before database storage
- **Goal**: Prevent providers from seeing transaction history and balances

#### Phase 2: Feedback & Optimization

- 🔄 Gather user feedback on flows and tradeoffs
- 🔄 Optimize user experience based on real usage
- 🔄 Refine security models and time delays

#### Phase 3: Enhanced Security

- 🔄 TEE (Trusted Execution Environment) integration
- 🔄 Zero-knowledge proofs for transaction validation
- 🔄 OFAC list checking for compliance so providers don't incriminate themselves
- 🔄 Relay attack mitigation
- 🔄 Start beta testing
- 🔄 **Encrypted communication** between client/provider
- 🔄 **Zero-knowledge proofs** for transaction validation

#### Phase 4: Technology Migration

- 🔄 Evaluate Flutter + Rust bridge architecture
- 🔄 Performance optimization and cross-platform support

#### Phase 5: Chain Code Delegation & Blind Schnorr Signatures

- 🔄 Implement [Chain Code Delegation](https://delvingbitcoin.org/t/chain-code-delegation-private-access-control-for-bitcoin-keys/1837) for privacy
- 🔄 [Blind Schnorr signatures](https://eprint.iacr.org/2022/1676.pdf) for transaction privacy
- 🔄 Scalar tweaks for client-side privacy
- **Goal**: Providers cannot see transaction history or balances

#### Phase 6: FROST MPC Integration

- 🔄 Multi-party computation for threshold signatures
- 🔄 Ultimate privacy indistinguishable from single-signature transactions
- 🔄 Better key management as you can roll keys without having to move funds
- 🔄 **Homomorphic encryption** for calculations
- 🔄 **Fully encrypted** transaction history
- **Goal**: Complete privacy and optimal key management

### Comparison to Other Solutions

While Seed-E has privacy limitations in its current form, it offers advantages over traditional backup solutions:

- **No KYC Required**: Unlike many backup services that require upfront identity verification
- **No Upfront xpub Sharing**: Clients don't need to provide their multi-sigs xpub to the platform
- **Time-delay Protection**: Built-in protection against immediate compromise
- **Lightning Payments**: Lower fees and faster settlement
- **Peer to Peer**: Settle with the provider directly using lightning addresses

However, **providers can still see your balance and transaction history until Phase 5**. This is still more private than solutions requiring upfront KYC and xpub sharing, but significant privacy improvements are planned.

## 🛠️ Technology Stack

- **Frontend**: Next.js 15 with React and TypeScript
- **Backend**: Next.js API Routes with Prisma ORM
- **Database**: PostgreSQL with encrypted storage
- **Payments**: Lightning Network with LNURL protocols
- **Bitcoin**: BIP32/BIP84 key management with PSBT support
- **Security**: bcrypt password hashing, TOTP 2FA

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Lightning Network node (LND recommended)

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/seed-e"

# Lightning Network
LND_REST_URL="http://localhost:8080"
LND_INVOICE_MACAROON="your-macaroon-here"

# Security
XPUB_HASH_SECRET="your-random-secret"
```

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/seed-e.git
cd seed-e

# Install dependencies
npm install

# Set up database
npx prisma migrate dev
npx prisma generate

# Start development server
npm run dev
```

## 📖 Documentation

- API Documentation found at ./API_ENDPOINTS.md
- Signature Request Specification found at ./SIGNATURE_REQUEST_SPEC.md
- Testing scripts found at ./tests

## 📄 License

This project is licensed under the MIT License

## ⚠️ Final Disclaimer

Seed-E is experimental software. Use at your own risk and never store more funds than you can afford to lose. Store no more than a thousand sats or so before closing beta! Always verify signatures and transactions independently. **Only use providers you absolutely trust and again, don't use this seriously until Beta testing comes to a close.**
