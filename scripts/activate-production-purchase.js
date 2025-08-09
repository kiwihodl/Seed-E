#!/usr/bin/env node

async function activateProductionPurchase() {
  console.log("🔧 Activating purchase on production site...");

  // Dynamic import for node-fetch
  const fetch = (await import("node-fetch")).default;

  try {
    // First, let's try to call the payment confirmation API
    // We need to find the payment hash from the purchase
    console.log("📝 Calling payment confirmation API...");

    // Try with a test payment hash first
    const confirmResponse = await fetch(
      "https://seed-e.org/api/services/confirm-payment",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentHash: "test-payment-hash",
        }),
      }
    );

    const confirmData = await confirmResponse.json();
    console.log("📊 Confirm payment response:", confirmData);

    // Now test the signature request again
    console.log("\n📝 Testing signature request after activation...");

    const testData = {
      clientId: "cmdx54bch0000ml1s2vwj6hyp",
      serviceId: "cmdx5iicf0004ml1st3pyohrl",
      amount: 10000,
    };

    const signatureResponse = await fetch(
      "https://seed-e.org/api/signature-requests/payment",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData),
      }
    );

    const signatureData = await signatureResponse.json();
    console.log("📊 Signature response status:", signatureResponse.status);
    console.log("📊 Signature response data:", signatureData);
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

activateProductionPurchase().catch(console.error);
