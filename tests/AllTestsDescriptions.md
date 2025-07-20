# Tests Directory

This directory contains all test and utility scripts for the Seed-E Lightning payment system.

## Quick Start

1. **Clean everything:** `node tests/cleanup-everything.js`
2. **Create fresh setup:** `node tests/create-fresh-provider.js`
3. **Test purchase flow:** `node tests/test-fresh-purchase.js`

## Key Files

- **`test-list.md`** - Complete documentation of all test files
- **`cleanup-everything.js`** - Clean database completely
- **`create-fresh-provider.js`** - Set up fresh test environment
- **`test-fresh-purchase.js`** - Test complete purchase flow
- **`debug-purchase.js`** - Debug purchase issues

## Organization

- **🧹 Cleanup Scripts** - Database cleanup utilities
- **🚀 Setup Scripts** - Environment setup
- **🔍 Debug Scripts** - Troubleshooting tools
- **📊 Check Scripts** - Status checking
- **🧪 Lightning Tests** - Lightning integration tests
- **🛒 Purchase Tests** - Purchase flow tests
- **🔧 Database Tests** - Database connectivity tests

See `test-list.md` for complete documentation of all files.
# Test Files Documentation

This directory contains all test and utility scripts for the Seed-E Lightning payment system.

## 🧹 Database Cleanup Scripts

### `cleanup-everything.js`

**Purpose:** Completely clean the database - removes all providers, services, clients, and purchases.
**Usage:** `node tests/cleanup-everything.js`
**When to use:** When you want to start fresh with a clean database.

### `cleanup-purchases.js`

**Purpose:** Remove all existing purchases while keeping providers and services.
**Usage:** `node tests/cleanup-purchases.js`
**When to use:** When you want to test fresh purchases without recreating providers.

### `cleanup-services.js`

**Purpose:** Remove services that don't use your Lightning address.
**Usage:** `node tests/cleanup-services.js`
**When to use:** To keep only services with your Lightning address for testing.

### `cleanup-old-services.js`

**Purpose:** Remove old services with Bolt12 offers.
**Usage:** `node tests/cleanup-old-services.js`
**When to use:** When migrating from Bolt12 to Lightning addresses.

### `cleanup-pending-purchases.js`

**Purpose:** Remove pending (inactive) purchases.
**Usage:** `node tests/cleanup-pending-purchases.js`
**When to use:** To clean up stuck pending purchases.

## 🚀 Setup Scripts

### `create-fresh-provider.js`

**Purpose:** Create a new provider with fresh services and test client.
**Usage:** `node tests/create-fresh-provider.js`
**When to use:** After cleaning the database to set up fresh test data.

### `register-provider.js`

**Purpose:** Register a test provider with multiple services.
**Usage:** `node tests/register-provider.js`
**When to use:** To create test providers with different policy types.

### `register-provider-and-add-keys.js`

**Purpose:** Register provider and add keys with Lightning addresses.
**Usage:** `node tests/register-provider-and-add-keys.js`
**When to use:** Complete provider setup with Lightning integration.

### `create-test-client.js`

**Purpose:** Create a test client for testing purchases.
**Usage:** `node tests/create-test-client.js`
**When to use:** When you need a fresh test client.

## 🔍 Debug Scripts

### `debug-purchase.js`

**Purpose:** Show all purchases and their details.
**Usage:** `node tests/debug-purchase.js`
**When to use:** To debug purchase issues or check purchase status.

### `debug-purchases.js`

**Purpose:** Alternative debug script for purchases.
**Usage:** `node tests/debug-purchases.js`
**When to use:** When the main debug script doesn't show what you need.

### `debug-xpub-value.js`

**Purpose:** Debug xpub key values in purchases.
**Usage:** `node tests/debug-xpub-value.js`
**When to use:** When xpub keys aren't showing correctly.

### `debug-voltage.js`

**Purpose:** Debug Voltage LND connection issues.
**Usage:** `node tests/debug-voltage.js`
**When to use:** When Lightning invoices aren't creating properly.

## 📊 Check Scripts

### `check-services.js`

**Purpose:** List all available services.
**Usage:** `node tests/check-services.js`
**When to use:** To see what services are available for purchase.

### `check-clients.js`

**Purpose:** List all registered clients.
**Usage:** `node tests/check-clients.js`
**When to use:** To see registered clients and their IDs.

### `check-existing-purchases.js`

**Purpose:** Show existing purchases and their status.
**Usage:** `node tests/check-existing-purchases.js`
**When to use:** To see what has been purchased.

### `check-payment-status.js`

**Purpose:** Check payment status for a specific hash.
**Usage:** `node tests/check-payment-status.js`
**When to use:** To debug payment confirmation issues.

### `check-pending-purchase.js`

**Purpose:** Check pending purchase details.
**Usage:** `node tests/check-pending-purchase.js`
**When to use:** To debug stuck pending purchases.

### `check-available-services.js`

**Purpose:** Check what services are available via API.
**Usage:** `node tests/check-available-services.js`
**When to use:** To verify the services API is working.

### `check-xpub.js`

**Purpose:** Check xpub key values in database.
**Usage:** `node tests/check-xpub.js`
**When to use:** To verify xpub keys are stored correctly.

## 🧪 Lightning Tests

### `test-lightning-service.js`

**Purpose:** Test the Lightning service configuration.
**Usage:** `node tests/test-lightning-service.js`
**When to use:** To verify Lightning service is working.

### `test-real-alby.js`

**Purpose:** Test real Alby Lightning address integration.
**Usage:** `node tests/test-real-alby.js`
**When to use:** To test with your real Alby Lightning address.

### `test-alby-verify.js`

**Purpose:** Test LNURL verify with Alby.
**Usage:** `node tests/test-alby-verify.js`
**When to use:** To test payment verification with Alby.

### `test-lnurl-validation.js`

**Purpose:** Test LNURL address validation.
**Usage:** `node tests/test-lnurl-validation.js`
**When to use:** To verify Lightning address validation.

### `test-lnurl-verify.js`

**Purpose:** Test LNURL verify functionality.
**Usage:** `node tests/test-lnurl-verify.js`
**When to use:** To test payment verification.

### `test-multiple-lnurl.js`

**Purpose:** Test multiple Lightning addresses.
**Usage:** `node tests/test-multiple-lnurl.js`
**When to use:** To test different Lightning address providers.

### `test-primal-lnurl.js`

**Purpose:** Test Primal Lightning address.
**Usage:** `node tests/test-primal-lnurl.js`
**When to use:** To test with Primal Lightning addresses.

### `test-decentralized-payment.js`

**Purpose:** Test decentralized payment flow.
**Usage:** `node tests/test-decentralized-payment.js`
**When to use:** To test the complete payment flow.

### `test-provider-invoice.js`

**Purpose:** Test provider invoice creation.
**Usage:** `node tests/test-provider-invoice.js`
**When to use:** To test invoice creation from provider Lightning addresses.

### `test-lightning-lookup.js`

**Purpose:** Test Lightning address lookup.
**Usage:** `node tests/test-lightning-lookup.js`
**When to use:** To test Lightning address resolution.

### `test-voltage.js`

**Purpose:** Test Voltage LND integration.
**Usage:** `node tests/test-voltage.js`
**When to use:** To test Voltage node connection.

### `test-hostname.js`

**Purpose:** Test hostname resolution.
**Usage:** `node tests/test-hostname.js`
**When to use:** To debug connection issues.

### `test-connection.js`

**Purpose:** Test network connections.
**Usage:** `node tests/test-connection.js`
**When to use:** To debug network connectivity.

### `test-btcpay.js`

**Purpose:** Test BTCPay Server integration.
**Usage:** `node tests/test-btcpay.js`
**When to use:** To test BTCPay Server as Lightning backend.

### `working-lightning-test.js`

**Purpose:** Comprehensive Lightning integration test.
**Usage:** `node tests/working-lightning-test.js`
**When to use:** To test the complete Lightning workflow.

### `simple-lightning-test.js`

**Purpose:** Simple Lightning test.
**Usage:** `node tests/simple-lightning-test.js`
**When to use:** For quick Lightning functionality tests.

### `test-lightning.js`

**Purpose:** Basic Lightning test.
**Usage:** `node tests/test-lightning.js`
**When to use:** For basic Lightning functionality verification.

### `test-lightning-simple.js`

**Purpose:** Minimal Lightning test.
**Usage:** `node tests/test-lightning-simple.js`
**When to use:** For minimal Lightning functionality tests.

## 🛒 Purchase Tests

### `test-fresh-purchase.js`

**Purpose:** Test a fresh purchase with real payment detection.
**Usage:** `node tests/test-fresh-purchase.js`
**When to use:** To test the complete purchase flow with real Lightning.

### `test-purchase-simple.js`

**Purpose:** Simple purchase test.
**Usage:** `node tests/test-purchase-simple.js`
**When to use:** For basic purchase functionality tests.

### `test-purchase-direct.js`

**Purpose:** Direct purchase creation test.
**Usage:** `node tests/test-purchase-direct.js`
**When to use:** To test direct purchase creation in database.

### `test-purchase-api.js`

**Purpose:** Test purchase API endpoints.
**Usage:** `node tests/test-purchase-api.js`
**When to use:** To test the purchase API functionality.

### `test-payment-confirmation.js`

**Purpose:** Test payment confirmation flow.
**Usage:** `node tests/test-payment-confirmation.js`
**When to use:** To test payment confirmation with LNURL verify.

## 🔧 Database Tests

### `test-prisma-simple.js`

**Purpose:** Test Prisma database connectivity.
**Usage:** `node tests/test-prisma-simple.js`
**When to use:** To verify database connection is working.

## 🔄 Update Scripts

### `update-services-to-lightning.js`

**Purpose:** Update services to use Lightning addresses instead of Bolt12.
**Usage:** `node tests/update-services-to-lightning.js`
**When to use:** When migrating from Bolt12 to Lightning addresses.

## 🔧 Fix Scripts

### `fix-xpub-key.js`

**Purpose:** Fix xpub key values in database.
**Usage:** `node tests/fix-xpub-key.js`
**When to use:** When xpub keys need to be corrected.

## 📋 List Scripts

### `list-pending-purchases.js`

**Purpose:** List all pending purchases.
**Usage:** `node tests/list-pending-purchases.js`
**When to use:** To see what purchases are pending confirmation.

## ✅ Confirmation Scripts

### `confirm-current-payment.js`

**Purpose:** Manually confirm a current payment.
**Usage:** `node tests/confirm-current-payment.js`
**When to use:** To manually confirm a payment for testing.

### `confirm-payment.js`

**Purpose:** Confirm a specific payment.
**Usage:** `node tests/confirm-payment.js`
**When to use:** To confirm a specific payment hash.

### `manual-confirm-payment.js`

**Purpose:** Manually confirm payment for testing.
**Usage:** `node tests/manual-confirm-payment.js`
**When to use:** For manual payment confirmation during development.

## 🔑 Key Generation

### `generate-real-keys.js`

**Purpose:** Generate real xpub keys for testing.
**Usage:** `node tests/generate-real-keys.js`
**When to use:** When you need real xpub keys for testing.

## 🧪 Test Provider

### `create-test-provider.js`

**Purpose:** Create a test provider for development.
**Usage:** `node tests/create-test-provider.js`
**When to use:** To create a test provider during development.

---

## Quick Start Guide

1. **Clean database:** `node tests/cleanup-everything.js`
2. **Create fresh setup:** `node tests/create-fresh-provider.js`
3. **Test purchase flow:** `node tests/test-fresh-purchase.js`
4. **Debug issues:** `node tests/debug-purchase.js`

## Common Test Scenarios

### Testing Payment Flow

```bash
node tests/cleanup-everything.js
node tests/create-fresh-provider.js
node tests/test-fresh-purchase.js
```

### Debugging Payment Issues

```bash
node tests/debug-purchase.js
node tests/check-payment-status.js
node tests/test-payment-confirmation.js
```

### Testing Lightning Integration

```bash
node tests/test-real-alby.js
node tests/test-lnurl-verify.js
node tests/test-voltage.js
```