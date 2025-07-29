#!/usr/bin/env node

const { config } = require("dotenv");
config();

function parseLndConnectUrl(lndConnectUrl) {
  // Check if it's a lndconnect URL
  if (lndConnectUrl.startsWith("lndconnect://")) {
    // lndconnect://host:port?macaroon=base64macaroon
    const match = lndConnectUrl.match(
      /lndconnect:\/\/([^?]+)(\?macaroon=([^&]+))?/
    );
    if (!match) {
      throw new Error("Invalid lndconnect URL format");
    }

    const hostPort = match[1];
    const macaroon = match[3];

    // Use https for all connections
    const restUrl = `https://${hostPort}`;

    return {
      restUrl,
      macaroon: macaroon
        ? Buffer.from(macaroon, "base64").toString("hex")
        : undefined,
    };
  } else {
    // Direct REST URL
    return {
      restUrl: lndConnectUrl,
      macaroon: undefined,
    };
  }
}

async function debugVoltage() {
  console.log("🔍 Debugging Voltage LND Connection...\n");

  const lndConnectUrl = process.env.LND_REST_URL;
  const lndMacaroon = process.env.LND_INVOICE_MACAROON;

  console.log("📋 Configuration:");
  console.log(`LND_REST_URL: ${lndConnectUrl}`);
  console.log(`LND_INVOICE_MACAROON: ${lndMacaroon ? "✅ Set" : "❌ Missing"}`);

  if (!lndConnectUrl) {
    console.log("\n❌ Missing LND_REST_URL!");
    return;
  }

  // Parse the lndconnect URL
  console.log("\n🔍 Parsing lndconnect URL...");
  const parsed = parseLndConnectUrl(lndConnectUrl);
  console.log(`Parsed REST URL: ${parsed.restUrl}`);
  console.log(
    `Parsed Macaroon: ${parsed.macaroon ? "✅ Extracted" : "❌ Not found"}`
  );

  console.log("\n🔍 Testing different endpoints...");

  const endpoints = ["/v1/info", "/v1/version", "/v1/getinfo", "/", "/health"];

  for (const endpoint of endpoints) {
    console.log(`\n🌐 Testing: ${parsed.restUrl}${endpoint}`);

    try {
      const response = await fetch(`${parsed.restUrl}${endpoint}`, {
        headers: {
          "Grpc-Metadata-macaroon": parsed.macaroon || lndMacaroon,
          "User-Agent": "Seed-E-Test/1.0",
        },
        timeout: 5000,
      });

      console.log(`Status: ${response.status}`);
      console.log(`Headers:`, Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.text();
        console.log(`✅ Success! Response: ${data.substring(0, 200)}...`);
        return;
      } else {
        const errorText = await response.text();
        console.log(`❌ Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`❌ Connection failed: ${error.message}`);
      console.log(`Error type: ${error.constructor.name}`);

      if (error.code) {
        console.log(`Error code: ${error.code}`);
      }
    }
  }

  console.log("\n🔧 Additional debugging:");
  console.log("1. Check if your Voltage node is running");
  console.log("2. Verify the API endpoint URL format");
  console.log("3. Check if you need to use HTTP instead of HTTPS");
  console.log("4. Verify the macaroon format");
}

debugVoltage().catch(console.error);
