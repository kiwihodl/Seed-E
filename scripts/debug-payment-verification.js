#!/usr/bin/env node

async function debugPaymentVerification() {
  console.log("🔍 Debugging payment verification...");

  // Dynamic import for node-fetch
  const fetch = (await import("node-fetch")).default;

  try {
    // Test the Lightning address validation
    console.log("📝 Testing Lightning address validation...");

    const validationResponse = await fetch(
      "https://seed-e.org/api/lightning/validate-address",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: "highlyregarded@getalby.com",
        }),
      }
    );

    const validationData = await validationResponse.json();
    console.log("📊 Lightning validation response:", validationData);

    // Test creating a payment request
    console.log("\n📝 Testing payment request creation...");

    const paymentResponse = await fetch(
      "https://seed-e.org/api/services/purchase",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceId: "cmdx5iicf0004ml1st3pyohrl",
          clientId: "cmdx54bch0000ml1s2vwj6hyp",
        }),
      }
    );

    const paymentData = await paymentResponse.json();
    console.log("📊 Payment request response:", paymentData);

    // Test payment confirmation with a real payment hash
    if (paymentData.paymentHash) {
      console.log("\n📝 Testing payment confirmation...");

      const confirmResponse = await fetch(
        "https://seed-e.org/api/services/confirm-payment",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentHash: paymentData.paymentHash,
          }),
        }
      );

      const confirmData = await confirmResponse.json();
      console.log("📊 Payment confirmation response:", confirmData);
    }
  } catch (error) {
    console.error("❌ Debug failed:", error.message);
  }
}

debugPaymentVerification().catch(console.error);
