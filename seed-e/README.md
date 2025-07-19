# Seed-E: Bitcoin Multisig Service Platform

A Next.js-based platform that connects Bitcoin clients and providers for secure multisig signing and backup services. Built with real Bitcoin integration, cryptographic validation, and Lightning Network payments.

## 🚀 Features

### **Real Bitcoin Integration**

- ✅ **Cryptographic Key Validation**: Real BIP32 xpub validation
- ✅ **ECDSA Signature Verification**: 64-byte signature validation
- ✅ **Fresh Key Generation**: Unique Bitcoin keys generated on demand
- ✅ **Duplicate Prevention**: System prevents same xpub being used twice
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

## 🛠 Technical Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, Prisma ORM
- **Database**: PostgreSQL with Docker
- **Bitcoin**: bitcoinjs-lib, bip32, tiny-secp256k1
- **Authentication**: TOTP 2FA with speakeasy
- **Payments**: Lightning Network (BOLT12)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- PostgreSQL

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

## 📊 Database Schema

### Core Models

- **Provider**: Service providers with authentication
- **Client**: End users requesting signatures
- **Service**: Bitcoin key configurations and policies
- **SignatureRequest**: Transaction signing requests
- **SubscriptionRequest**: Payment and subscription management

### Key Features

- **Real Bitcoin Data**: xpub, signatures, BOLT12 offers
- **Time-based Releases**: Configurable signature delays
- **Payment Integration**: Lightning Network payments
- **Audit Trail**: Complete transaction history

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

### Test Data Generation

- `GET /api/generate-test-data` - Generate fresh Bitcoin keys and signatures

## 🎯 Current Status

### ✅ **Completed Features**

- Real Bitcoin key validation and generation
- Cryptographic signature verification
- Interactive provider dashboard
- Comprehensive form validation
- Dark/light mode support
- Database integration with Prisma

### 🔄 **In Development**

- Key derivation and management
- Service discovery protocol
- Advanced Lightning Network integration
- Client dashboard implementation

### ⏳ **Planned Features**

- Automated signature processing
- Advanced analytics and monitoring
- Multi-provider support
- Mobile application

## 🔒 Security Features

- **Real Cryptographic Validation**: All Bitcoin keys and signatures are cryptographically verified
- **Duplicate Prevention**: System prevents same xpub being used multiple times
- **Time-based Security**: Configurable delays for signature releases
- **2FA Protection**: Two-factor authentication for all accounts
- **Secure Storage**: Encrypted sensitive data storage

## 🎨 UI/UX Features

- **Persistent Themes**: Dark/light mode with localStorage persistence
- **Interactive Elements**: Clickable cards, modals, and visual feedback
- **Real-time Validation**: Form validation with immediate feedback
- **Responsive Design**: Mobile-friendly interface
- **Accessibility**: Proper contrast ratios and keyboard navigation

## 🚨 Important Notes

### Server Management

- Always check for existing servers before starting new ones
- Use `ps aux | grep "next dev"` to check running servers
- Use `curl -I http://localhost:3000` to test server response

### Development Guidelines

- Use Tailwind CSS v3 (not v4) for proper dark mode support
- All new components must support both light and dark modes
- Follow the established color scheme (#FF9500 orange accent)
- Implement proper error handling and validation

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

---

**Built with ❤️ for the Bitcoin community**
