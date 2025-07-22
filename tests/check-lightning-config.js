#!/usr/bin/env node

const { config } = require("dotenv");

config();

console.log("🔧 Lightning Service Configuration Check");
console.log("=".repeat(50));

// Check environment variables
console.log("Environment Variables:");
console.log(`LND_REST_URL: ${process.env.LND_REST_URL ? "SET" : "NOT SET"}`);
console.log(
  `LND_INVOICE_MACAROON: ${
    process.env.LND_INVOICE_MACAROON ? "SET" : "NOT SET"
  }`
);

// Determine if we're in mock mode
const hasLndConfig = !!(
  process.env.LND_REST_URL && process.env.LND_INVOICE_MACAROON
);
const isMockMode = !hasLndConfig;

console.log("\nConfiguration Status:");
console.log(`Has LND Config: ${hasLndConfig}`);
console.log(`Mock Mode: ${isMockMode}`);

if (isMockMode) {
  console.log("\n⚠️  System is in MOCK MODE");
  console.log("   - No real Lightning node connection");
  console.log("   - Using LNURL verify for payment confirmation");
  console.log("   - Mock invoices generated for testing");
} else {
  console.log("\n✅ System is using REAL LIGHTNING NODE");
  console.log("   - LND REST API configured");
  console.log("   - Real Lightning invoices will be created");
  console.log("   - Real payment verification via LND");
}

console.log("\nPayment Verification Methods:");
console.log("1. LNURL Verify (when provider supports it)");
console.log("2. LND API (when not in mock mode)");
console.log("3. Mock verification (fallback)");

console.log("\n" + "=".repeat(50));
