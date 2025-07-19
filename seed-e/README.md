# Seed-E: Bitcoin Multisig Service Platform

A Next.js-based platform that connects Bitcoin clients and providers for secure multisig signing and backup services. Built with real Bitcoin integration, cryptographic validation, and Lightning Network payments.

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

## 🧪 Testing

### Manual Testing

1. **Client Registration**: Test user registration and validation
2. **Service Purchase**: Test the complete purchase flow
3. **Provider Dashboard**: Test service creation and management
4. **Security**: Verify xpub hashing and purchase tracking

### API Testing

Test the core APIs:

```bash
# Test services API
curl -X GET http://localhost:3000/api/services

# Test purchase API (replace with actual IDs)
curl -X POST http://localhost:3000/api/services/purchase \
  -H "Content-Type: application/json" \
  -d '{"serviceId":"service-id","clientId":"client-id"}'
```

### Security Testing

- Verify xpubs are hashed in database
- Test purchase tracking prevents duplicate purchases
- Verify purchased services disappear from marketplace

## 🚀 Deployment

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

### Docker Deployment

```bash
# Build Docker image
docker build -t seed-e .

# Run with environment variables
docker run -p 3000:3000 \
  -e DATABASE_URL="your-db-url" \
  -e XPUB_HASH_SECRET="your-secret" \
  seed-e
```

### Environment Setup

1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations: `npx prisma db push`
4. Build and start the application

## 🔧 Troubleshooting

### Common Issues

**Build Errors**

- Ensure all dependencies are installed: `npm install`
- Check TypeScript errors: `npm run build`
- Verify environment variables are set

**Database Issues**

- Check PostgreSQL is running: `docker-compose ps`
- Reset database if needed: `npx prisma db push --force-reset`
- Verify DATABASE_URL in .env

**Purchase Issues**

- Check user is logged in and userId is stored
- Verify service exists and is not already purchased
- Check browser console for debugging messages

**Security Issues**

- Ensure XPUB_HASH_SECRET is set
- Verify xpubs are hashed in database
- Check purchase tracking is working

### Debugging

**Check Server Status**

```bash
# Check if server is running
curl -I http://localhost:3000

# Check running processes
ps aux | grep "next dev"
```

**Database Debugging**

```bash
# Check database connection
npx prisma db pull

# View database schema
npx prisma studio
```

**API Debugging**

```bash
# Test API endpoints
curl -X GET http://localhost:3000/api/services
curl -X GET http://localhost:3000/api/clients/purchased-services?clientId=test
```

## 📊 Database Schema

### Core Models

- **Provider**: Service providers with authentication
- **Client**: End users requesting signatures
- **Service**: Bitcoin key configurations and policies (with hashed xpubs)
- **SignatureRequest**: Transaction signing requests
- **SubscriptionRequest**: Payment and subscription management

### Key Features

- **Real Bitcoin Data**: xpub hashes, signatures, BOLT12 offers
- **Time-based Releases**: Configurable signature delays
- **Payment Integration**: Lightning Network payments
- **Audit Trail**: Complete transaction history

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

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly with real Bitcoin data
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Support

For support and questions, please open an issue on GitHub or contact the development team.